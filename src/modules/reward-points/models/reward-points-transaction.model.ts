import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { RewardType } from './reward-points.model';
import { PoolConnection } from 'mysql2/promise';

/**
 * Reward points model.
 */
export class RewardPointsTransaction extends AdvancedSQLModel {
  /**
   * Reward points's table.
   */
  public tableName = DbTables.REWARD_POINTS_TRANSACTION;

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

  /**
   * Gets total reward points for specific user.
   *
   * @param userId User ID.
   * @param conn Pool connection.
   * @returns Total reward points.
   */
  public async getUserPoints(userId: number, conn?: PoolConnection): Promise<number> {
    const rows = await this.db().paramExecute(
      `
        SELECT SUM(value) totalPoints
        FROM ${DbTables.REWARD_POINTS_TRANSACTION}
        WHERE user_id = @userId
          AND status <> ${SqlModelStatus.DELETED}
      `,
      { userId },
      conn
    );

    return rows.length && rows[0].totalPoints ? rows[0].totalPoints : 0;
  }
}
