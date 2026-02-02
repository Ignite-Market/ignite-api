import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';
import { JSONParser } from '../../../lib/parsers';

export class GenerateFromTemplateDto extends ModelBase {
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER]
  })
  public price?: number;

  @prop({
    parser: { resolver: integerParser() },
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
}
