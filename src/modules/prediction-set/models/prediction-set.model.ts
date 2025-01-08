import { prop } from '@rawmodel/core';
import { dateParser, floatParser, integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PoolConnection } from 'mysql2/promise';
import { DbTables, ErrorCode, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { enumInclusionValidator } from '../../../lib/validators';
import { Outcome } from './outcome.model';

export enum PredictionSetStatus {
  INITIALIZED = 1,
  PENDING = 2,
  ACTIVE = 3,
  ERROR = 4
}

/**
 * Prediction set model.
 */
export class PredictionSet extends AdvancedSQLModel {
  /**
   * Prediction set 's table.
   */
  public tableName = DbTables.PREDICTION_SET;

  /**
   * Set ID - A distinct code that uniquely identifies each prediction set within the platform.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB]
  })
  setId: string;

  /**
   * Initial pool.
   */
  @prop({
    parser: {
      resolver: floatParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_INITIAL_POOL_NOT_PRESENT
      }
    ]
  })
  initialPool: number;

  /**
   * Question - The central query or event being predicted, clearly framed to avoid ambiguity.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_QUESTION_NOT_PRESENT
      }
    ]
  })
  question: string;

  /**
   * Description - A detailed explanation of the event or context behind the prediction, ensuring users understand its background and significance.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_DESCRIPTION_NOT_PRESENT
      }
    ]
  })
  description: string;

  /**
   * General resolution definition - A high-level summary of how the prediction will be resolved, offering clarity on the expected evaluation process.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_GENERAL_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  generalResolutionDef: string;

  /**
   * Outcome resolution definition - Specific criteria and data sources that determine the official resolution of the prediction, ensuring transparency and accuracy.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_OUTCOME_RESOLUTION_NOT_PRESENT
      }
    ]
  })
  outcomeResolutionDef: string;

  /**
   * Outcome price definition -  A description of how outcome prices are calculated, including references to external price feeds or oracles like the Flare Price Oracle.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_OUTCOME_PRICE_NOT_PRESENT
      }
    ]
  })
  outcomePriceDef: string;

  /**
   * Start time - The official launch date and time when the prediction market opens for trading.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_START_TIME_NOT_PRESENT
      }
    ]
  })
  public startTime: Date;

  /**
   * End time - The final date and time when trading closes, after which no further market activity is allowed.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_END_TIME_NOT_PRESENT
      }
    ]
  })
  public endTime: Date;

  /**
   * Resolution time - The scheduled time when the market's outcome is finalized, based on pre-defined resolution criteria.
   */
  @prop({
    parser: { resolver: dateParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_RESOLUTION_TIME_NOT_PRESENT
      }
    ]
  })
  public resolutionTime: Date;

  /**
   * Set status.
   * - 1: INITIALIZED - When the set is created.
   * - 2: PENDING - When the set is syncing with the blockchain.
   * - 3: ACTIVE - When the set is ready for predictions.
   * - 4: ERROR - When the set is in error state.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: enumInclusionValidator(PredictionSetStatus),
        code: ErrorCode.INVALID_STATUS
      }
    ],
    emptyValue: () => PredictionSetStatus.INITIALIZED,
    defaultValue: () => PredictionSetStatus.INITIALIZED
  })
  public setStatus: PredictionSetStatus;

  /**
   * Prediction set's outcomes virtual property definition.
   */
  @prop({
    parser: { resolver: Object, array: true },
    serializable: [SerializeFor.USER],
    populatable: [PopulateFrom.DB],
    defaultValue: () => []
  })
  public outcomes: Outcome[];

  /**
   * Adds a data source to the prediction set.
   * @param dataSourceId Data source ID.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async addDataSource(dataSourceId: number, conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
          INSERT IGNORE INTO ${DbTables.PREDICTION_SET_DATA_SOURCE} (prediction_set_id, data_source_id)
          VALUES (@predictionSetId, @dataSourceId)
        `,
      {
        predictionSetId: this.id,
        dataSourceId
      },
      conn
    );

    return this;
  }

  /**
   * Remove all data sources for this prediction set.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async deleteDataSources(conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
          DELETE FROM  ${DbTables.PREDICTION_SET_DATA_SOURCE} 
          WHERE prediction_set_id = @predictionSetId
        `,
      {
        predictionSetId: this.id
      },
      conn
    );

    return this;
  }

  /**
   * Remove all outcomes for this prediction set.
   * @param conn Database connection.
   * @returns Prediction set.
   */
  public async deleteOutcomes(conn?: PoolConnection): Promise<PredictionSet> {
    await this.db().paramExecute(
      `
          DELETE FROM ${DbTables.OUTCOME} 
          WHERE prediction_set_id = @predictionSetId
        `,
      {
        predictionSetId: this.id
      },
      conn
    );

    return this;
  }
}
