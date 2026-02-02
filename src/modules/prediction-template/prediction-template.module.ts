import { Module } from '@nestjs/common';
import { PredictionTemplateController } from './prediction-template.controller';
import { PredictionTemplateService } from './prediction-template.service';

@Module({
  controllers: [PredictionTemplateController],
  providers: [PredictionTemplateService]
})
export class PredictionTemplateModule {}
