import { HttpStatus, Injectable } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';
import { BadRequestErrorCode, ResourceNotFoundErrorCode, SerializeFor, SystemErrorCode } from '../../config/types';
import { Context } from '../../context';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { CodeException } from '../../lib/exceptions/exceptions';
import { RewardPointsTransaction } from './models/reward-points-transaction.model';
import { RewardPoints, RewardType } from './models/reward-points.model';

@Injectable()
export class RewardPointsService {
  /**
   * Check if user can claim daily reward.
   * @param context Context.
   * @returns Whether user can claim daily reward.
   */
  public async canUserClaimDailyReward(context: Context): Promise<boolean> {
    return await new RewardPointsTransaction({}, context).canClaimDailyReward(context.user.id);
  }

  /**
   * Claim user daily reward.
   *
   * @param context Context.
   * @returns User reward points.
   */
  public async claimUserDailyReward(context: Context) {
    const canClaim = await this.canUserClaimDailyReward(context);
    if (!canClaim) {
      throw new CodeException({
        code: BadRequestErrorCode.DAILY_REWARD_ALREADY_CLAIMED,
        errorCodes: BadRequestErrorCode,
        status: HttpStatus.BAD_REQUEST,
        sourceFunction: `${this.constructor.name}/claimUserDailyReward`,
        context
      });
    }

    const reward = await RewardPointsService.awardPoints(context.user.id, RewardType.DAILY_LOGIN, context);
    return reward.serialize(SerializeFor.USER);
  }

  /**
   * Get reward points.
   * @param query Query filter.
   * @param context Context.
   */
  public async getRewardPoints(query: BaseQueryFilter, context: Context): Promise<any> {
    return await new RewardPoints({}, context).getList(query);
  }

  /**
   * Award points to a user.
   * @param userId User ID.
   * @param rewardType Reward type.
   * @param context Context.
   * @param conn Pool connection.
   */
  public static async awardPoints(userId: number, rewardType: RewardType, context: Context, conn?: PoolConnection): Promise<RewardPointsTransaction> {
    const rewardPoints = await new RewardPoints({}, context).populateByType(rewardType, conn);
    if (!rewardPoints.exists() || !rewardPoints.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.REWARD_POINTS_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/awardPoints`,
        context
      });
    }

    const transaction = new RewardPointsTransaction(
      {
        user_id: userId,
        reward_points_id: rewardPoints.id,
        value: rewardPoints.value,
        type: rewardPoints.type
      },
      context
    );

    try {
      await transaction.insert(SerializeFor.INSERT_DB, conn);
    } catch (error) {
      throw new CodeException({
        code: SystemErrorCode.SQL_SYSTEM_ERROR,
        errorCodes: SystemErrorCode,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        sourceFunction: `${this.constructor.name}/awardPoints`,
        details: error,
        context
      });
    }

    return transaction;
  }

  /**
   * Get user reward points.
   * @param userId User ID.
   * @param context Context.
   * @returns User reward points.
   */
  public static async getUserRewardPoints(userId: number, context: Context): Promise<number> {
    return await new RewardPointsTransaction({}, context).getUserPoints(userId);
  }
}
