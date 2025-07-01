import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';

export class ProposalsQueryFilter extends BaseQueryFilter {
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public roundId: number;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public proposalId: number;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public tag: string;
}
