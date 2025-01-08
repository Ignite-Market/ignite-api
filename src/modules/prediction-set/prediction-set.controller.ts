import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DefaultUserRole, PopulateFrom } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { PredictionSetDto } from './dtos/prediction-set.dto';
import { Outcome } from './models/outcome.model';
import { PredictionGroup } from './models/prediction-group.model';
import { PredictionSet } from './models/prediction-set.model';
import { PredictionSetService } from './prediction-set.service';

@Controller('prediction-sets')
export class PredictionSetController {
  constructor(private readonly predictionSetService: PredictionSetService) {}

  // TODO: Admin routes to update + delete prediction sets - that are not yet active!
  // TODO: Admin route to cancel prediction set/prediction set group - set status + call to BC.
  // TODO: Route to list prediction sets/groups for FE. Listing should list single prediction sets (not in groups) and grouped prediction sets.

  @Post()
  @Validation({ dto: PredictionSetDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createPredictionSet(@Body() data: PredictionSetDto, @Ctx() context: Context) {
    const predictionSet = new PredictionSet(data.serialize(), context);
    predictionSet.outcomes = data.predictionOutcomes.map((d) => new Outcome(d.serialize(), context));

    return await this.predictionSetService.createPredictionSet(predictionSet, data.dataSourceIds, context);
  }

  @Post('groups')
  @Validation({ dto: PredictionGroup })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createPredictionGroup(@Body() predictionGroup: PredictionGroup, @Ctx() context: Context) {
    return await this.predictionSetService.createPredictionGroup(predictionGroup, context);
  }

  @Patch('groups/:id/process')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async processPredictionGroup(@Param('id', ParseIntPipe) predictionGroupId: number, @Ctx() context: Context) {
    return await this.predictionSetService.processPredictionGroup(predictionGroupId, context);
  }

  // @Get('')
  // @UseGuards(AuthGuard)
  // @Roles()
  // async getPredictions(@Query() query, @Ctx() context: Context) {
  //   return await this.predictionSetService.getPredictions(query, context);
  // }

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
}
