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
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';

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
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(AuthGuard, ValidationGuard)
  async getPredictions(@Query() query: BaseQueryFilter, @Ctx() context: Context) {
    return await this.predictionSetService.getPredictions(query, context);
  }

  @Put('/:id')
  @Validation({ dto: PredictionSetDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async updatePredictionSet(@Param('id', ParseIntPipe) id: number, @Body() data: PredictionSetDto, @Ctx() context: Context) {
    return await this.predictionSetService.updatePredictionSet(id, data, context);
  }

  @Patch('/:id/cancel')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async cancelPredictionSet(@Param('id', ParseIntPipe) id: number, @Ctx() context: Context) {
    return await this.predictionSetService.cancelPredictionSet(id, context);
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
}
