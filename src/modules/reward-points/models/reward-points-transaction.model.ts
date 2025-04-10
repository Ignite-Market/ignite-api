import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { RewardType } from './reward-points.model';

/**
 * Reward points model.
 */
export class RewardPointsTransaction extends AdvancedSQLModel {
  /**
   * Reward points's table.
   */
  public tableName = DbTables.REWARD_POINTS;

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
   * Reward points ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public reward_points_id: number;

  /**
   * Reward points value.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public value: number;

  /**
   * Reward points type.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public type: RewardType;
}
