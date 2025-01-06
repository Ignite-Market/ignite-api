import { HttpStatus, Injectable } from '@nestjs/common';
import { BadRequestErrorCode, ResourceNotFoundErrorCode, SerializeFor, SystemErrorCode } from '../../config/types';
import { Context } from '../../context';
import { sendToWorkerQueue } from '../../lib/aws/aws-sqs';
import { CodeException } from '../../lib/exceptions/exceptions';
import { WorkerName } from '../../workers/worker-executor';
import { DataSource } from './models/data-source.model';
import { PredictionGroup, PredictionGroupStatus } from './models/prediction-group.model';
import { PredictionSet, PredictionSetStatus } from './models/prediction-set.model';

@Injectable()
export class PredictionSetService {
  /**
   * Create prediction group.
   * @param predictionGroup Prediction group.
   * @param context Application context.
   * @returns Prediction group.
   */
  public async createPredictionGroup(predictionGroup: PredictionGroup, context: Context) {
    try {
      await predictionGroup.insert(SerializeFor.INSERT_DB);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/createPredictionGroup`,
        details: error,
        context
      });
    }

    return predictionGroup.serialize(SerializeFor.USER);
  }

  /**
   * Process prediction group.
   * @param predictionGroupId Prediction group ID.
   * @param context Application context.
   * @returns Prediction group.
   */
  public async processPredictionGroup(predictionGroupId: number, context: Context) {
    const predictionGroup = await new PredictionGroup({}, context).populateById(predictionGroupId);
    if (!predictionGroup.exists() || !predictionGroup.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_GROUP_DOES_NOT_EXISTS,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/processPredictionGroup`,
        context
      });
    }

    if (predictionGroup.groupStatus !== PredictionGroupStatus.INITIALIZED && predictionGroup.groupStatus !== PredictionGroupStatus.ERROR) {
      throw new CodeException({
        code: BadRequestErrorCode.INVALID_PREDICTION_GROUP,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/processPredictionGroup`,
        errorMessage: 'Prediction group is not in the correct state to be processed.',
        context
      });
    }

    const predictionSets = await predictionGroup.getPredictionSets();
    if (predictionSets.length < 3) {
      throw new CodeException({
        code: BadRequestErrorCode.INVALID_PREDICTION_GROUP,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/processPredictionGroup`,
        errorMessage: 'Prediction group must have at least 2 prediction sets.',
        context
      });
    }

    const conn = await context.mysql.start();
    try {
      predictionGroup.groupStatus = PredictionGroupStatus.PENDING;
      await predictionGroup.update(SerializeFor.UPDATE_DB, conn);
      await predictionGroup.updatePredictionSetsStatus(PredictionSetStatus.PENDING, conn);

      await context.mysql.commit(conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/processPredictionGroup`,
        details: error,
        context
      });
    }

    await sendToWorkerQueue(
      WorkerName.CREATE_PREDICTION_GROUP,
      [
        {
          predictionGroupId: predictionGroup.id
        }
      ],
      context
    );

    return predictionGroup.serialize(SerializeFor.USER);
  }

  /**
   * Create prediction set.
   * @param predictionSet Prediction set.
   * @param dataSourceIds Data source IDs.
   * @param context Application context.
   */
  public async createPredictionSet(predictionSet: PredictionSet, dataSourceIds: number[], context: Context) {
    const conn = await context.mysql.start();

    // Create prediction set.
    predictionSet.setId = this._generatePredictionSetId(predictionSet);
    try {
      await predictionSet.insert(SerializeFor.INSERT_DB, conn);
    } catch (error) {
      await context.mysql.rollback(conn);

      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/createPredictionSet`,
        details: error,
        context
      });
    }

    // Add prediction set to prediction group.
    if (predictionSet.prediction_group_id) {
      const predictionGroup = await new PredictionGroup({}, context).populateById(predictionSet.prediction_group_id, conn);
      if (!predictionGroup.exists() || !predictionGroup.isEnabled()) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: ResourceNotFoundErrorCode.PREDICTION_GROUP_DOES_NOT_EXISTS,
          status: HttpStatus.NOT_FOUND,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          context
        });
      }
    }

    // Add data sources to the prediction set.
    for (const dataSourceId of dataSourceIds) {
      const dataSource = await new DataSource({}, context).populateById(dataSourceId, conn);
      if (!dataSource.exists() || !dataSource.isEnabled()) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: ResourceNotFoundErrorCode.DATA_SOURCE_DOES_NOT_EXISTS,
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
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          details: error,
          context
        });
      }
    }

    // Add outcomes to the prediction set.
    const outcomePool = predictionSet.initialPool / predictionSet.outcomes.length;
    for (const outcome of predictionSet.outcomes) {
      try {
        outcome.pool = outcomePool;
        await outcome.insert(SerializeFor.INSERT_DB, conn);
      } catch (error) {
        await context.mysql.rollback(conn);

        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
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
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/createPredictionSet`,
        details: error,
        context
      });
    }

    // If prediction set is not part of a prediction group, we start processing.
    if (!predictionSet.prediction_group_id) {
      try {
        predictionSet.setStatus = PredictionSetStatus.PENDING;
        await predictionSet.update();

        await sendToWorkerQueue(
          WorkerName.CREATE_PREDICTION_SET,
          [
            {
              predictionSetId: predictionSet.id
            }
          ],
          context
        );
      } catch (error) {
        throw new CodeException({
          code: SystemErrorCode.SQL_SYSTEM_ERROR,
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          sourceFunction: `${this.constructor.name}/createPredictionSet`,
          details: error,
          context
        });
      }
    }

    return predictionSet.serialize(SerializeFor.USER);
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
