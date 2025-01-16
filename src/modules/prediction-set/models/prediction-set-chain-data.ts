import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { PoolConnection } from 'mysql2/promise';

/**
 * Prediction set blockchain data.
 */
export class PredictionSetChainData extends AdvancedSQLModel {
  /**
   * Prediction set blockchain data table.
   */
  public tableName = DbTables.PREDICTION_SET_CHAIN_DATA;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public prediction_set_id: number;

  /**
   * Question ID - Bytes 32 generated from prediction set ID.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public questionId: string;

  /**
   * Condition ID - Obtained from conditional token contract.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public conditionId: string;

  /**
   * Prediction set contract creation transaction hash.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public txHash: string;

  /**
   * Prediction set contract address.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public contractAddress: string;

  /**
   * Last processed block.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public lastProcessedBlock: number;

  /**
   * Last processed block.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public parseBlockSize: number;

  /**
   *
   * @param conditionId
   * @param conn
   * @param forUpdate
   * @returns
   */
  public async populateByConditionId(conditionId: string, conn?: PoolConnection, forUpdate = false): Promise<this> {
    if (!conditionId) {
      return this.reset();
    }
    this.reset();

    const data = await this.getContext().mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET_CHAIN_DATA}
        WHERE
          conditionId = @conditionId
          AND status <> ${SqlModelStatus.DELETED}
        ${conn && forUpdate ? 'FOR UPDATE' : ''};
        `,
      { conditionId },
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }

  /**
   *
   * @param predictionSetId
   * @param conn
   * @param forUpdate
   * @returns
   */
  public async populateByPredictionSetId(predictionSetId: number, conn?: PoolConnection, forUpdate = false): Promise<this> {
    if (!predictionSetId) {
      return this.reset();
    }
    this.reset();

    const data = await this.getContext().mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.PREDICTION_SET_CHAIN_DATA}
        WHERE
          prediction_set_id = @predictionSetId
          AND status <> ${SqlModelStatus.DELETED}
        ${conn && forUpdate ? 'FOR UPDATE' : ''};
        `,
      { predictionSetId },
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }
}
