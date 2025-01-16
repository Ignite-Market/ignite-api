import { prop } from '@rawmodel/core';
import { floatParser, integerParser, stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';

/**
 * Prediction set outcome chance.
 */
export class OutcomeChance extends AdvancedSQLModel {
  /**
   * Outcome chance's table.
   */
  public tableName = DbTables.OUTCOME_CHANCE;

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
   * Outcome chance.
   */
  @prop({
    parser: { resolver: floatParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public chance: number;

  /**
   * Outcome conditional tokens supply.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public supply: string;

  /**
   * Total supply of conditional tokens on prediction set.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB, SerializeFor.UPDATE_DB]
  })
  public totalSupply: string;
}
