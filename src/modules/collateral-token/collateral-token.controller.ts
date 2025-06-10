import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { ValidationGuard } from '../../guards/validation.guard';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { CollateralTokenService } from './collateral-token.service';

@Controller('collateral-tokens')
export class CollateralTokenController {
  constructor(private readonly collateralTokenService: CollateralTokenService) {}

  @Get()
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getCollateralTokens(@Query() query: any, @Ctx() context: Context) {
    return await this.collateralTokenService.getCollateralTokens(query, context);
  }
}
