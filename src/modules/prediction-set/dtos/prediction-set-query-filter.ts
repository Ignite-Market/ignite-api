import { prop } from '@rawmodel/core';
import { booleanParser, integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { PredictionSetStatus } from '../models/prediction-set.model';

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

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public status: PredictionSetStatus;
}
