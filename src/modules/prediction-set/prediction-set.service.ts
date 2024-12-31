import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { create } from 'domain';
import { PredictionSet } from './models/prediction-set.model';
import { Context } from '../../context';
import { ResourceNotFoundErrorCode, SerializeFor, SystemErrorCode } from '../../config/types';
import { CodeException } from '../../lib/exceptions/exceptions';
import { DataSource } from './models/data-source.model';
import { Outcome } from './models/outcome';

@Injectable()
export class PredictionSetService {
  /**
   * Create prediction set.
   * @param predictionSet Prediction set.
   * @param dataSourceIds Data source IDs.
   * @param context Application context.
   */
  public async createPredictionSet(predictionSet: PredictionSet, dataSourceIds: number[], predictionOutcomes: Outcome[], context: Context) {
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

    // Add data sources to the prediction set.
    for (const dataSourceId of dataSourceIds) {
      const dataSource = await new DataSource({}, context).populateById(dataSourceId, conn);
      if (!dataSource) {
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
    const outcomePool = predictionSet.initialPool / predictionOutcomes.length;
    for (const outcome of predictionOutcomes) {
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

    const outcomeCode = '';
    // const outcomeCode = predictionSet.outcomes.map((outcome) => outcome[0].toUpperCase()).join('');

    const startTimeCode = predictionSet.startTime.toISOString().slice(0, 10).replace(/-/g, '');
    const endTimeCode = predictionSet.endTime.toISOString().slice(0, 10).replace(/-/g, '');
    const resolutionTimeCode = predictionSet.resolutionTime.toISOString().slice(0, 10).replace(/-/g, '');

    return `${eventCode}_${outcomeCode}_S${startTimeCode}_E${endTimeCode}_RES${resolutionTimeCode}_ID${Number(new Date())}`;
  }
}
