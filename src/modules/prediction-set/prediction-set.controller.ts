import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PredictionSetService } from './prediction-set.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { PredictionSetDto } from './dtos/prediction-set.dto';
import { ValidationGuard } from '../../guards/validation.guard';
import { Roles } from '../../decorators/role.decorator';
import { DefaultUserRole } from '../../config/types';
import { PredictionSet } from './models/prediction-set.model';
import { Outcome } from './models/outcome';

@Controller('prediction-sets')
export class PredictionSetController {
  constructor(private readonly predictionSetService: PredictionSetService) {}

  @Post()
  @Validation({ dto: PredictionSetDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createPredictionSet(@Body() data: PredictionSetDto, @Ctx() context: Context) {
    const predictionSet = new PredictionSet(data.serialize(), context);
    const dataSourceIds = data.dataSourceIds;
    const predictionOutcomes = data.predictionOutcomes.map((d) => new Outcome(d.serialize(), context));

    return await this.predictionSetService.createPredictionSet(predictionSet, dataSourceIds, predictionOutcomes, context);
  }
}
