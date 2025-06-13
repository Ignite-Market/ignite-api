import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../../config/types';
import { AdvancedSQLModel } from '../../../../lib/base-models/advanced-sql.model';

/**
 * Outcome voting transaction model.
 */
export class OutcomeVotingTransaction extends AdvancedSQLModel {
  /**
   * Outcome voting transactions table.
   */
  public tableName = DbTables.OUTCOME_VOTING_TRANSACTION;

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
   * Transaction's question ID.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public questionId: string;

  /**
   * Transaction outcome index.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public outcomeIndex: number;
}
