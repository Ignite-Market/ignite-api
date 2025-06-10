import { Module } from '@nestjs/common';
import { CollateralTokenController } from './collateral-token.controller';
import { CollateralTokenService } from './collateral-token.service';

@Module({
  controllers: [CollateralTokenController],
  providers: [CollateralTokenService]
})
export class CollateralTokenModule {}
