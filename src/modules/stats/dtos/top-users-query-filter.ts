import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom, TimeRange, ValidatorErrorCode } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { presenceValidator } from '@rawmodel/validators';

/**
 * Query filter for retrieving top users by profit.
 */
export class TopUsersQueryFilter extends BaseQueryFilter {
  /**
   * Filter by collateral token ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.TOP_USERS_QUERY_FILTER_COLLATERAL_TOKEN_ID_NOT_PRESENT
      }
    ]
  })
  public collateralTokenId: number;

  /**
   * Filter by time range.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    defaultValue: TimeRange.ALL
  })
  public range: TimeRange;
}
