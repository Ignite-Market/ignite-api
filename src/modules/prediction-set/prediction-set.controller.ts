import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DefaultUserRole, SerializeFor, ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { PredictionSetDto } from './dtos/prediction-set.dto';
import { Outcome } from './models/outcome.model';
import { PredictionSet } from './models/prediction-set.model';
import { PredictionSetService } from './prediction-set.service';
import { PredictionSetQueryFilter } from './dtos/prediction-set-query-filter';
import { PredictionSetChanceHistoryQueryFilter } from './dtos/prediction-set-chance-history-query-filter';
import { ActivityQueryFilter } from './dtos/activity-query-filter';
import { HoldersQueryFilter } from './dtos/holders-query-filter';

@Controller('prediction-sets')
export class PredictionSetController {
  constructor(private readonly predictionSetService: PredictionSetService) {}

  @Post()
  @Validation({ dto: PredictionSetDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createPredictionSet(@Body() data: PredictionSetDto, @Ctx() context: Context) {
    const predictionSet = new PredictionSet(data.serialize(), context);
    predictionSet.outcomes = data.predictionOutcomes.map((d) => new Outcome(d.serialize(), context));

    return (await this.predictionSetService.createPredictionSet(predictionSet, data.dataSourceIds, context)).serialize(SerializeFor.USER);
  }

  @Get('')
  @Validation({ dto: PredictionSetQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictions(@Query() query: PredictionSetQueryFilter, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionSets(query, context);
  }

  @Get('/activity')
  @Validation({ dto: ActivityQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictionSetActivity(@Query() query: ActivityQueryFilter, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionSetActivity(query, context);
  }

  @Get('/holders')
  @Validation({ dto: HoldersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictionSetHolders(@Query() query: HoldersQueryFilter, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionSetHolders(query, context);
  }

  @Get('/banners')
  async getBanners(@Ctx() context: Context) {
    return await this.predictionSetService.getBanners(context);
  }

  @Get('/:id')
  async getPredictionById(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionById(id, context);
  }

  @Get('/:id/positions')
  @Validation({ dto: HoldersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictionSetPositions(@Param('id', ParseIntPipe) predictionSetId: number, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionSetPositions(predictionSetId, context);
  }

  @Get('/:id/funding-positions')
  @Validation({ dto: HoldersQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictionSetFundingPositions(@Param('id', ParseIntPipe) predictionSetId: number, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictionSetFundingPositions(predictionSetId, context);
  }

  @Get('/:id/chance-history')
  @Validation({ dto: PredictionSetChanceHistoryQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getPredictionChanceHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PredictionSetChanceHistoryQueryFilter,
    @Ctx() context: Context
  ) {
    return await this.predictionSetService.getPredictionChanceHistory(id, query, context);
  }

  @Put('/:id')
  @Validation({ dto: PredictionSetDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async updatePredictionSet(@Param('id', ParseIntPipe) id: number, @Body() data: PredictionSetDto, @Ctx() context: Context) {
    return await this.predictionSetService.updatePredictionSet(id, data, context);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async deletePredictionSet(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.deletePredictionSet(id, context);
  }

  @Patch('/:id/process')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async processPredictionSet(@Param('id', ParseIntPipe) predictionSetId: number, @Ctx() context: Context) {
    return await this.predictionSetService.processPredictionSet(predictionSetId, context);
  }

  @Post('/:id/watchlist')
  @UseGuards(AuthGuard)
  async addUserWatchlist(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.addUserWatchlist(id, context);
  }

  @Delete('/:id/watchlist')
  @UseGuards(AuthGuard)
  async removeUserWatchlist(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.removeUserWatchlist(id, context);
  }

  @Post('/:id/removed-funding')
  @UseGuards(AuthGuard)
  async triggerFinalizedWorker(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.triggerFinalizedWorker(id, context);
  }
}
