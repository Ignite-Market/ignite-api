import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { ValidationGuard } from '../../guards/validation.guard';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { RewardPointsService } from './reward-points.service';
import { AuthGuard } from '../../guards/auth.guard';

@Controller('reward-points')
export class RewardPointsController {
  constructor(private readonly rewardPointsService: RewardPointsService) {}

  @Get()
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getRewardPoints(@Query() query: any, @Ctx() context: Context) {
    return await this.rewardPointsService.getRewardPoints(query, context);
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getUserRewardPoints(@Ctx() context: Context) {
    const points = await RewardPointsService.getUserRewardPoints(context.user.id, context);
    return { points };
  }

  @Get('/daily')
  @UseGuards(AuthGuard)
  async canUserClaimDailyReward(@Ctx() context: Context) {
    const canClaim = await this.rewardPointsService.canUserClaimDailyReward(context);
    return { canClaim };
  }

  @Patch('/daily')
  @UseGuards(AuthGuard)
  async claimUserDailyReward(@Ctx() context: Context) {
    return this.rewardPointsService.claimUserDailyReward(context);
  }
}
