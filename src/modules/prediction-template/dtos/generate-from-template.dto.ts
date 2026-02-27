import { prop } from '@rawmodel/core';
import { floatParser, integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';
import { JSONParser } from '../../../lib/parsers';

export class GenerateFromTemplateDto extends ModelBase {
  @prop({
    parser: { resolver: floatParser() },
    populatable: [PopulateFrom.USER]
  })
  public price?: number;

  @prop({
    parser: { resolver: floatParser() },
    populatable: [PopulateFrom.USER]
  })
  public goal?: number;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public comparisonType?: 'above' | 'below';

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public attestationTime?: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public homeTeamName?: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public awayTeamName?: string;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public sofascoreMatchId?: number;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public livescoreEid?: number;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public livescoreCategory?: string;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public pandascoreMatchId?: number;
}
