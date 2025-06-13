import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

export class HoldersQueryFilter extends BaseQueryFilter {
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public predictionId: number;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public outcomeId: number;
}
