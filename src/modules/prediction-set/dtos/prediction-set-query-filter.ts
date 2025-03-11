import { prop } from '@rawmodel/core';
import { booleanParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

export class PredictionSetQueryFilter extends BaseQueryFilter {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public tag: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public category: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public search: string;

  @prop({
    parser: { resolver: booleanParser() },
    populatable: [PopulateFrom.USER]
  })
  public watchlist: boolean;
}
