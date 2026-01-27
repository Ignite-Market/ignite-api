import { HttpStatus, Injectable } from '@nestjs/common';
import { env } from '../../config/env';
import {
  BadRequestErrorCode,
  DbTables,
  DefaultUserRole,
  PopulateFrom,
  ResourceNotFoundErrorCode,
  SerializeFor,
  SqlModelStatus,
  SystemErrorCode,
  ValidatorErrorCode
} from '../../config/types';
import { Context } from '../../context';
import { sendToWorkerQueue, triggerWorkerSimpleQueue } from '../../lib/aws/aws-sqs';
import { CodeException, ValidationException } from '../../lib/exceptions/exceptions';
import { WorkerName } from '../../workers/worker-executor';
import { ActivityQueryFilter } from './dtos/activity-query-filter';
import { HoldersQueryFilter } from './dtos/holders-query-filter';
import { PredictionSetChanceHistoryQueryFilter } from './dtos/prediction-set-chance-history-query-filter';
import { PredictionSetQueryFilter } from './dtos/prediction-set-query-filter';
import { PredictionSetDto } from './dtos/prediction-set.dto';
import { Banner } from '../banner/models/banner';
import { DataSource } from './models/data-source.model';
import { Outcome } from './models/outcome.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from './models/prediction-set.model';
import { UserWatchlist } from './models/user-watchlist';
import { CollateralToken } from '../collateral-token/models/collateral-token.model';
import { GenerateSuggestionsDto } from './dtos/generate-suggestions.dto';
import { OpenAI } from 'openai';
import { PoolConnection } from 'mysql2/promise';

@Injectable()
export class PredictionSetService {
  /**
   * Process prediction set.
   *
   * @param predictionSetId Prediction set ID.
   * @param context Application context.
   * @returns Prediction set.
   */
  public async processPredictionSet(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/processPredictionSet`,
        context
      });
    }

    if (![PredictionSetStatus.INITIALIZED, PredictionSetStatus.ERROR].includes(predictionSet.setStatus)) {
      throw new CodeException({
        code: BadRequestErrorCode.INVALID_PREDICTION_SET_STATUS,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/processPredictionSet`,
        errorMessage: 'Prediction set is not in the correct state to be processed.',
        context
      });
    }

    try {
      predictionSet.setStatus = PredictionSetStatus.PENDING;
      await predictionSet.update();
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/processPredictionSet`,
        details: error,
        context
      });
    }

    await sendToWorkerQueue(
      WorkerName.CREATE_PREDICTION_SET,
      [
        {
          predictionSetId: predictionSet.id
        }
      ],
      context
    );

    return predictionSet.serialize(SerializeFor.USER);
  }

  /**
   * Create prediction set.
   *
   * @param predictionSet Prediction set.
   * @param dataSourceIds Data source IDs.
   * @param context Application context.
   */
  public async createPredictionSet(
    predictionSet: PredictionSet,
    dataSourceIds: number[],
    context: Context,
    categories?: string[]
  ): Promise<PredictionSet> {
    const conn = await context.mysql.start();

    const collateralToken = await new CollateralToken({}, context).populateById(predictionSet.collateral_token_id);
    if (!collateralToken.exists() || !collateralToken.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.COLLATERAL_TOKEN_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/createPredictionSet`,
        context
      });
    }

    // Create prediction set.
    try {
      await predictionSet.validate();
      await predictionSet.insert(SerializeFor.INSERT_DB, conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      await predictionSet.handle(error);
      if (!predictionSet.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      } else {
        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          details: error,
          context
        });
      }
    }

    /**
     * Handle data sources for automatic prediction set resolution.
     */
    if (predictionSet.resolutionType === ResolutionType.AUTOMATIC) {
      // Minimal data sources threshold.
      if (dataSourceIds.length < env.PREDICTION_SET_MINIMAL_DATA_SOURCES) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: BadRequestErrorCode.INVALID_NUMBER_OF_PREDICTION_SET_DATA_SOURCES,
          errorCodes: BadRequestErrorCode,
          status: HttpStatus.BAD_REQUEST,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          context
        });
      }

      // Add data sources to the prediction set.
      for (const dataSourceId of dataSourceIds) {
        // TODO: Do a check if data sources can be used for attestation!

        const dataSource = await new DataSource({}, context).populateById(dataSourceId, conn);
        if (!dataSource.exists() || !dataSource.isEnabled()) {
          await context.mysql.rollback(conn);

          throw new CodeException({
            code: ResourceNotFoundErrorCode.DATA_SOURCE_DOES_NOT_EXISTS,
            errorCodes: ResourceNotFoundErrorCode,
            status: HttpStatus.NOT_FOUND,
            sourceFunction: `${this.constructor.name}/createPredictionSet`,
            context
          });
        }

        try {
          await predictionSet.addDataSource(dataSource.id, conn);
        } catch (error) {
          await context.mysql.rollback(conn);

          throw new CodeException({
            code: SystemErrorCode.SQL_SYSTEM_ERROR,
            errorCodes: SystemErrorCode,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            sourceFunction: `${this.constructor.name}/createPredictionSet`,
            details: error,
            context
          });
        }
      }
    }

    // Add outcomes to the prediction set.
    for (const [index, outcome] of predictionSet.outcomes.entries()) {
      try {
        outcome.outcomeIndex = index;
        outcome.prediction_set_id = predictionSet.id;

        await outcome.insert(SerializeFor.INSERT_DB, conn);
      } catch (error) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          details: error,
          context
        });
      }
    }

    if (categories) {
      for (const category of categories) {
        await this.addPredictionCategory(predictionSet.id, category, context, conn);
      }
    }

    try {
      await context.mysql.commit(conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/createPredictionSet`,
        details: error,
        context
      });
    }

    return predictionSet;
  }

  /**
   * Update prediction set.
   *
   * @param predictionSetId Prediction set ID.
   * @param predictionSetData Prediction set data.
   * @param context Application context.
   */
  public async updatePredictionSet(predictionSetId: number, predictionSetData: PredictionSetDto, context: Context) {
    const conn = await context.mysql.start();

    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId, conn);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/updatePredictionSet`,
        context
      });
    }

    // Only update if not processed/pending.
    if (![PredictionSetStatus.INITIALIZED, PredictionSetStatus.ERROR].includes(predictionSet.setStatus)) {
      throw new CodeException({
        code: BadRequestErrorCode.INVALID_PREDICTION_SET_STATUS,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/updatePredictionSet`,
        errorMessage: 'Prediction set is not in the correct state to be processed.',
        context
      });
    }

    // Delete and add new data sources to the prediction set
    await predictionSet.deleteDataSources(conn);
    for (const dataSourceId of predictionSetData.dataSourceIds) {
      const dataSource = await new DataSource({}, context).populateById(dataSourceId, conn);
      if (!dataSource.exists() || !dataSource.isEnabled()) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: ResourceNotFoundErrorCode.DATA_SOURCE_DOES_NOT_EXISTS,
          errorCodes: ResourceNotFoundErrorCode,
          status: HttpStatus.NOT_FOUND,
          sourceFunction: `${this.constructor.name}/updatePredictionSet`,
          context
        });
      }

      try {
        await predictionSet.addDataSource(dataSource.id, conn);
      } catch (error) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/updatePredictionSet`,
          details: error,
          context
        });
      }
    }

    // Delete and add new outcomes to the prediction set
    await predictionSet.deleteOutcomes(conn);
    for (const [index, predictionOutcome] of predictionSetData.predictionOutcomes.entries()) {
      try {
        const outcome = new Outcome(predictionOutcome, context);
        outcome.outcomeIndex = index;
        outcome.prediction_set_id = predictionSet.id;

        await outcome.insert(SerializeFor.INSERT_DB, conn);
        predictionSet.outcomes.push(outcome);
      } catch (error) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          errorCodes: SystemErrorCode,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/updatePredictionSet`,
          details: error,
          context
        });
      }
    }

    predictionSet.populate(predictionSetData, PopulateFrom.USER);
    try {
      await predictionSet.update(SerializeFor.UPDATE_DB, conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/updatePredictionSet`,
        details: error,
        context
      });
    }

    try {
      await context.mysql.commit(conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/updatePredictionSet`,
        details: error,
        context
      });
    }

    return predictionSet.serialize(SerializeFor.USER);
  }

  /**
   * Add prediction category.
   *
   * @param predictionSetId Prediction set ID.
   * @param category Category name.
   * @param context Application context.
   */
  public async addPredictionCategory(predictionSetId: number, category: string, context: Context, conn?: PoolConnection) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId, conn);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/updatePredictionSet`,
        context
      });
    }

    await context.mysql.paramExecute(
      `
        INSERT INTO ${DbTables.PREDICTION_SET_CATEGORY} (prediction_set_id, category, status)
        VALUES (@predictionSetId, @category, ${SqlModelStatus.ACTIVE})
      `,
      {
        predictionSetId: predictionSet.id,
        category
      },
      conn
    );

    return predictionSet.serialize(SerializeFor.USER);
  }

  /**
   * Returns listing of prediction.
   *
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction group.
   */
  public async getPredictionSets(query: PredictionSetQueryFilter, context: Context, isAdmin: boolean = false) {
    return await new PredictionSet({}, context).getList(query, isAdmin);
  }

  /**
   * Get prediction set by ID.
   *
   * @param id Prediction set ID.
   * @param context Application context.
   * @returns Prediction set.
   */
  public async getPredictionById(id: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(id, null, false, {
      outcomes: true,
      chainData: true,
      isWatched: true,
      volume: true,
      positions: true, // TODO: Remove positions from the response.
      fundingPositions: true
    });

    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionById`,
        context
      });
    }

    // Check if prediction is hidden and user is not admin
    if (predictionSet.hide === true && !(await context.hasRole(DefaultUserRole.ADMIN))) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionById`,
        context
      });
    }

    return predictionSet.serialize(SerializeFor.USER);
  }

  /**
   * Get prediction set positions.
   *
   * @param id Prediction set ID.
   * @param context Application context.
   * @returns Prediction set positions.
   */
  public async getPredictionSetPositions(id: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(id, null, false, {
      positions: true
    });

    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionSetPositions`,
        context
      });
    }

    return predictionSet.positions;
  }

  /**
   * Get prediction set funding positions.
   *
   * @param id Prediction set ID.
   * @param context Application context.
   * @returns Prediction set funding positions.
   */
  public async getPredictionSetFundingPositions(id: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(id, null, false, {
      fundingPositions: true
    });

    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionSetFundingPositions`,
        context
      });
    }

    return predictionSet.fundingPositions;
  }

  /**
   * Get prediction set activity.
   *
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction set activity.
   */
  public async getPredictionSetActivity(query: ActivityQueryFilter, context: Context) {
    return await new PredictionSet({}, context).getActivityList(query);
  }

  /**
   * Get prediction set holders.
   *
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction set holders.
   */
  public async getPredictionSetHolders(query: HoldersQueryFilter, context: Context) {
    return await new PredictionSet({}, context).getHoldersList(query);
  }

  /**
   * Delete prediction set.
   *
   * @param predictionSet Prediction set.
   * @param context Application context.
   */
  public async deletePredictionSet(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);

    // Only delete if not processed/pending.
    if (![PredictionSetStatus.INITIALIZED, PredictionSetStatus.ERROR].includes(predictionSet.setStatus)) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/deletePredictionSet`,
        context
      });
    }

    predictionSet.status = SqlModelStatus.DELETED;
    await predictionSet.update();
  }

  /**
   * Get prediction chance history.
   *
   * @param predictionSetId Prediction set ID.
   * @param query Query filter.
   * @param context Application context.
   * @returns Prediction chance history.
   */
  public async getPredictionChanceHistory(predictionSetId: number, query: PredictionSetChanceHistoryQueryFilter, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionChanceHistory`,
        context
      });
    }

    return await predictionSet.getChanceHistory(query);
  }

  /**
   * Get prediction set data sources.
   *
   * @param predictionSetId Prediction set ID.
   * @param context Application context.
   * @returns Prediction set data sources.
   */
  public async getPredictionSetDataSources(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);

    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/getPredictionSetDataSources`,
        context
      });
    }

    return await predictionSet.getDataSources();
  }

  /**
   * Add user watchlist.
   *
   * @param predictionSetId Prediction set ID.
   * @param context Application context.
   * @returns True if user watchlist added, false otherwise.
   */
  public async addUserWatchlist(predictionSetId: number, context: Context) {
    const existingWatchlist = await new UserWatchlist({}, context).populateByUserAndPredictionSetId(context.user.id, predictionSetId);
    if (existingWatchlist.exists()) {
      return true;
    }

    const watchlist = new UserWatchlist({}, context).populate({
      prediction_set_id: predictionSetId,
      user_id: context.user.id
    });

    await watchlist.insert();

    return true;
  }

  /**
   * Remove user watchlist.
   *
   * @param predictionSetId Prediction set ID.
   * @param context Application context.
   * @returns True if user watchlist removed, false otherwise.
   */
  public async removeUserWatchlist(predictionSetId: number, context: Context) {
    const existingWatchlist = await new UserWatchlist({}, context).populateByUserAndPredictionSetId(context.user.id, predictionSetId);

    if (existingWatchlist.exists()) {
      await existingWatchlist.delete();
    }

    return true;
  }

  /**
   * Trigger finalized worker.
   *
   * @param predictionSetId Prediction set ID.
   * @param context Application context.
   * @returns True if worker triggered, false otherwise.
   */
  public async triggerFinalizedWorker(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/triggerFinalizedWorker`,
        context
      });
    }

    if (predictionSet.setStatus !== PredictionSetStatus.FINALIZED) {
      throw new CodeException({
        code: BadRequestErrorCode.INVALID_PREDICTION_SET_STATUS,
        errorCodes: BadRequestErrorCode,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/triggerFinalizedWorker`,
        context
      });
    }

    await triggerWorkerSimpleQueue(WorkerName.PREDICTION_SET_FINALIZED_PARSER, predictionSetId);
  }

  public async generateSuggestions(data: GenerateSuggestionsDto, context: Context) {
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });

    const now = new Date().toISOString();

    const instructions = `You are an API that returns prediction market questions. Always respond with a JSON object with an "items" array. 
StartTime should be ${now}, endTime should end relative to the prediction and resolutionTime should be 1 day after endTime. All predictions should be of events that are happening in the future. 
For predictionOutcome imgUrl assignment:
- Use "https://images.ignitemarket.xyz/outcomes/yes.svg" for positive/affirmative outcomes like: "Yes", "Will happen", "Success", "Approved", "Win", "Pass", etc.
- Use "https://images.ignitemarket.xyz/outcomes/no.svg" for negative/rejection outcomes like: "No", "Won't happen", "Fail", "Rejected", "Lose", "Delayed", "Lost", "Cancelled", "Denied", etc.
- Use "https://images.ignitemarket.xyz/outcomes/maybe.svg" for uncertain/unknown outcomes like: "Maybe", "Unknown", "Other", "Neither", "Unclear", "Postponed", "TBD", etc.
- Use empty string "" for all other specific outcomes that don't fit the above categories (like specific names, numbers, dates, etc.).
Example response: {"items": [{"question": "Will the Hang Seng Index be above 24,000 at market close on June 30?", "outcomeResolutionDef": "This market will resolve to 'Yes' if the official closing value of the Hang Seng Index on June 30, 2025, as reported by a reliable financial source (e.g., https://www.investing.com/indices/hang-sen-40 or https://www.bloomberg.com), is strictly greater than 24,000. Otherwise, it will resolve to 'No'.", "startTime": "2025-06-17T00:00:00", "endTime": "2025-06-30T16:00:00", "resolutionTime": "2025-07-01T08:00:00", "predictionOutcomes": [{"name": "Yes", "imgUrl": "https://images.ignitemarket.xyz/outcomes/yes.svg"}, {"name": "No", "imgUrl": "https://images.ignitemarket.xyz/outcomes/no.svg"}]}]}. `;

    const jsonSchema = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              outcomeResolutionDef: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              resolutionTime: { type: 'string' },
              predictionOutcomes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    imgUrl: { type: 'string' }
                  },
                  required: ['name', 'imgUrl'],
                  additionalProperties: false
                }
              }
            },
            required: ['question', 'outcomeResolutionDef', 'startTime', 'endTime', 'resolutionTime', 'predictionOutcomes'],
            additionalProperties: false
          }
        }
      },
      required: ['items'],
      additionalProperties: false
    };

    const response = await openai.responses.create({
      model: 'gpt-4o-mini-2024-07-18',
      instructions,
      input: data.prompt,
      text: {
        format: {
          type: 'json_schema',
          name: 'PredictionSetSuggestions',
          schema: jsonSchema
        }
      }
    });

    try {
      // The response should be a JSON array as a string
      const content = response.output_text;
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed?.items)) {
        throw new Error('OpenAI response is not an array');
      }

      return parsed.items;
    } catch (err) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/generateSuggestions`,
        errorMessage: 'Failed to parse OpenAI response as array of objects',
        details: err,
        context
      });
    }
  }
}
