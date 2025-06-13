import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../../config/types';
import { AdvancedSQLModel } from '../../../../lib/base-models/advanced-sql.model';

/**
 * Outcome share transaction type.
 */
export enum ShareTransactionType {
  BUY = 1,
  SELL = 2
}

/**
 * Prediction set outcome share transaction model.
 */
export class OutcomeShareTransaction extends AdvancedSQLModel {
  /**
   * Outcome shares transactions table.
   */
  public tableName = DbTables.OUTCOME_SHARE_TRANSACTION;

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
   * User ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public user_id: number;

  /**
   * Outcome ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public outcome_id: number;

  /**
   * Transaction hash.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public txHash: string;

  /**
   * Transaction's user wallet.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public wallet: string;

  /**
   * Transaction amount.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public amount: string;

  /**
   * Transaction fee amount.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public feeAmount: string;

  /**
   * Transaction outcome index.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public outcomeIndex: number;

  /**
   * Transaction outcome tokens (bought or sold).
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public outcomeTokens: string;

  /**
   * Transaction type (BUY/SELL).
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public type: ShareTransactionType;
}
