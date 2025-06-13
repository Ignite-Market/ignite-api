import { Injectable } from '@nestjs/common';
import { Context } from '../../context';
import { CollateralToken } from './models/collateral-token.model';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';

@Injectable()
export class CollateralTokenService {
  /**
   * Get list of collateral tokens.
   *
   * @param query Query filter.
   * @param context Application context.
   * @returns List of collateral tokens.
   */
  public async getCollateralTokens(query: BaseQueryFilter, context: Context): Promise<boolean> {
    return await new CollateralToken({}, context).getList(query);
  }
}
