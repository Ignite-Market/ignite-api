import { Module } from '@nestjs/common';
import { PredictionSetController } from './prediction-set.controller';
import { PredictionSetService } from './prediction-set.service';

@Module({
  controllers: [PredictionSetController],
  providers: [PredictionSetService]
})
export class PredictionSetModule {}
