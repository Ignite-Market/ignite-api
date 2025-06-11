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
  public async getUserPoints(userId: number, conn?: PoolConnection): Promise<{ totalPoints: number; referralCount: number; referralPoints: number }> {
    const rows = await this.db().paramExecute(
      `
        SELECT IFNULL(SUM(value), 0) totalPoints,
        IFNULL(COUNT(CASE WHEN type = ${RewardType.USER_REFERRAL} THEN 1 ELSE NULL END), 0) referralCount,
        IFNULL(SUM(CASE WHEN type = ${RewardType.USER_REFERRAL} THEN value ELSE 0 END), 0) referralPoints
        FROM ${DbTables.REWARD_POINTS_TRANSACTION}
        WHERE user_id = @userId
          AND status <> ${SqlModelStatus.DELETED}
      `,
      { userId },
      conn
    );

    return rows.length ? rows[0] : { totalPoints: 0, referralCount: 0, referralPoints: 0 };
  }

  /**
   * Check if user can claim daily reward.
   *
   * @param userId User ID.
   * @param conn Pool connection.
   * @returns Whether user can claim daily reward.
   */
  public async canClaimDailyReward(userId: number, conn?: PoolConnection): Promise<boolean> {
    const lastClaim = await this.db().paramExecute(
      `
      SELECT createTime 
      FROM ${DbTables.REWARD_POINTS_TRANSACTION}
      WHERE user_id = @userId 
        AND type = ${RewardType.DAILY_LOGIN}
        AND DATE(createTime) = CURDATE()
      ORDER BY createTime DESC
      LIMIT 1
    `,
      { userId },
      conn
    );

    return lastClaim.length === 0;
  }
}
