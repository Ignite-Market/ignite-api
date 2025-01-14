import { HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestErrorCode, PopulateFrom, ResourceNotFoundErrorCode, SerializeFor, SqlModelStatus, SystemErrorCode } from '../../config/types';
import { Context } from '../../context';
import { sendToWorkerQueue } from '../../lib/aws/aws-sqs';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { CodeException } from '../../lib/exceptions/exceptions';
import { WorkerName } from '../../workers/worker-executor';
import { PredictionSetDto } from './dtos/prediction-set.dto';
import { DataSource } from './models/data-source.model';
import { Outcome } from './models/outcome.model';
import { PredictionSet, PredictionSetStatus, ResolutionType } from './models/prediction-set.model';
import { env } from '../../config/env';

@Injectable()
export class PredictionSetService {
  /**
   * Process prediction set.
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
   * @param predictionSet Prediction set.
   * @param dataSourceIds Data source IDs.
   * @param context Application context.
   */
  public async createPredictionSet(predictionSet: PredictionSet, dataSourceIds: number[], context: Context): Promise<PredictionSet> {
    const conn = await context.mysql.start();

    // Create prediction set.
    predictionSet.setId = this._generatePredictionSetId(predictionSet);
    try {
      await predictionSet.validate();
      await predictionSet.insert(SerializeFor.INSERT_DB, conn);
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

    /**
     * Handle data sources for automatic prediction set resolution.
     */
    if (predictionSet.resolutionType === ResolutionType.AUTOMATIC) {
      // Minimal data sources threshold.
      if (dataSourceIds.length < env.PREDICTION_SET_MINIMAL_DATA_SOURCES) {
        throw new CodeException({
          code: BadRequestErrorCode.INVALID_NUMBER_OF_PREDICTION_SET_DATA_SOURCES,
          errorCodes: BadRequestErrorCode,
          status: HttpStatus.BAD_REQUEST,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          context
        });
      }

      // There needs to be more datasource than consensus threshold.
      if (dataSourceIds.length < predictionSet.consensusThreshold) {
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
    const outcomePool = predictionSet.initialPool / predictionSet.outcomes.length;
    for (const outcome of predictionSet.outcomes) {
      try {
        outcome.pool = outcomePool;
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
   * @param predictionSetId Prediction set ID.
   * @param predictionSetData Prediction set data.
   * @param context Application context.
   */
  public async updatePredictionSet(predictionSetId: number, predictionSetData: PredictionSetDto, context: Context) {
    const conn = await context.mysql.start();

    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId, conn);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
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
    const outcomePool = predictionSetData.initialPool / predictionSetData.predictionOutcomes.length;
    for (const predictionOutcome of predictionSetData.predictionOutcomes) {
      try {
        const outcome = new Outcome(predictionOutcome, context);
        outcome.pool = outcomePool;
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
   * Returns listing of prediction.
   * @param query Filtering query.
   * @param context Application context.
   * @returns Prediction group.
   */
  public async getPredictions(query: BaseQueryFilter, context: Context) {
    return await new PredictionSet({}, context).getList(query);
  }

  /**
   * Cancel prediction set.
   * @param predictionSet Prediction set.
   * @param context Application context.
   */
  public async cancelPredictionSet(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);

    // Only delete if processed/pending
    if (![PredictionSetStatus.PENDING, PredictionSetStatus.ACTIVE].includes(predictionSet.setStatus)) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/cancelPredictionSet`,
        context
      });
    }

    predictionSet.setStatus = PredictionSetStatus.INITIALIZED;
    await predictionSet.update();

    // TODO: Cancel on blockchain
  }

  /**
   * Delete prediction set.
   * @param predictionSet Prediction set.
   * @param context Application context.
   */
  public async deletePredictionSet(predictionSetId: number, context: Context) {
    const predictionSet = await new PredictionSet({}, context).populateById(predictionSetId);

    // Only delete if not processed/pending
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
   * Get prediction set ID.
   *
   * @param predictionSet Prediction set.
   * @returns Prediction set ID.
   */
  private _generatePredictionSetId(predictionSet: PredictionSet): string {
    const eventCode = predictionSet.question
      .split(/\s+/)
      .filter((word) => word.match(/^[a-zA-Z0-9]+$/))
      .map((word) => word[0].toUpperCase())
      .join('');

    const outcomeCode = predictionSet.outcomes.map((outcome) => outcome.name[0].toUpperCase()).join('');
    const startTimeCode = predictionSet.startTime.toISOString().slice(0, 10).replace(/-/g, '');
    const endTimeCode = predictionSet.endTime.toISOString().slice(0, 10).replace(/-/g, '');
    const resolutionTimeCode = predictionSet.resolutionTime.toISOString().slice(0, 10).replace(/-/g, '');

    return `${eventCode}_${outcomeCode}_S${startTimeCode}_E${endTimeCode}_RES${resolutionTimeCode}_ID${Number(new Date())}`;
  }
}
