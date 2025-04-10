import { Module } from '@nestjs/common';
import { RewardPointsController } from './reward-points.controller';
import { RewardPointsService } from './reward-points.service';

@Module({
  controllers: [RewardPointsController],
  providers: [RewardPointsService]
})
export class RewardPointsModule {}
