import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { ValidationGuard } from '../../guards/validation.guard';
import { TopUsersQueryFilter } from './dtos/top-users-query-filter';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('leaderboard/profit')
  @Validation({ dto: TopUsersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getTopUsersByProfit(@Query() query: TopUsersQueryFilter, @Ctx() context: Context) {
    return this.statsService.getTopUsersByProfit(query, context);
  }

  @Get('leaderboard/points')
  @Validation({ dto: TopUsersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getTopUsersByRewardPoints(@Query() query: TopUsersQueryFilter, @Ctx() context: Context) {
    return this.statsService.getTopUsersByRewardPoints(query, context);
  }

  @Get('leaderboard/volume')
  @Validation({ dto: TopUsersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getTopUsersByVolume(@Query() query: TopUsersQueryFilter, @Ctx() context: Context) {
    return this.statsService.getTopUsersByVolume(query, context);
  }
}
