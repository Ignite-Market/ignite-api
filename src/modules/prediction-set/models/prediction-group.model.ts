import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { DbTables, ErrorCode, PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { enumInclusionValidator } from '../../../lib/validators';
import { PredictionSetStatus } from './prediction-set.model';
import { PoolConnection } from 'mysql2/promise';

/**
 * Prediction group status.
 */
export enum PredictionGroupStatus {
  INITIALIZED = 1,
  PENDING = 2,
  ACTIVE = 3,
  CANCELED = 4,
  ERROR = 5,
  FINALIZED = 6
}

/**
 * Prediction group.
 */
export class PredictionGroup extends AdvancedSQLModel {
  /**
   * Prediction group's table.
   */
  public tableName = DbTables.PREDICTION_GROUP;

  /**
   * Prediction group name.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_GROUP_NAME_NOT_PRESENT
      }
    ]
  })
  name: string;

  /**
   * Prediction group description.
   */
  @prop({
    parser: {
      resolver: stringParser()
    },
    populatable: [PopulateFrom.DB, PopulateFrom.USER],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.UPDATE_DB, SerializeFor.INSERT_DB]
  })
  description: string;

  /**
   * Group status.
   * - 1: INITIALIZED - When the group is created.
   * - 2: PENDING - When the group is syncing with the blockchain.
   * - 3: ACTIVE - When the group is ready for predictions.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER, PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB],
    validators: [
      {
        resolver: enumInclusionValidator(PredictionGroupStatus),
        code: ErrorCode.INVALID_STATUS
      }
    ],
    emptyValue: () => PredictionGroupStatus.INITIALIZED,
    defaultValue: () => PredictionGroupStatus.INITIALIZED
  })
  public groupStatus: PredictionGroupStatus;

  /**
   * Update prediction sets statuses.
   * @param setStatus Prediction set status.
   * @param conn Database connection.
   */
  public async updatePredictionSetsStatus(setStatus: PredictionSetStatus, conn?: PoolConnection) {
    await this.db().paramExecute(
      `
        UPDATE ${DbTables.PREDICTION_SET}
        SET setStatus = @setStatus
        WHERE prediction_group_id = @groupId
      `,
      {
        setStatus,
        groupId: this.id
      },
      conn
    );
  }

  /**
   * Get prediction sets.
   * @param conn Database connection.
   * @returns Prediction sets.
   */
  public async getPredictionSets(conn?: PoolConnection): Promise<any[]> {
    return await this.db().paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET}
        WHERE prediction_group_id = @groupId
      `,
      {
        groupId: this.id
      },
      conn
    );
  }
}
