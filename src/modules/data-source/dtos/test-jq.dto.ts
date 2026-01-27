import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { JSONParser } from '../../../lib/parsers';
import { ModelBase } from '../../../lib/base-models/base';

export class TestJqDto extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.DATA_SOURCE_JQ_QUERY_NOT_PRESENT
      }
    ]
  })
  public jqQuery: string;

  @prop({
    parser: { resolver: JSONParser() },
    populatable: [PopulateFrom.USER]
  })
  public sampleResponse: any;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public endpoint: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public httpMethod: string;

  @prop({
    parser: { resolver: JSONParser() },
    populatable: [PopulateFrom.USER]
  })
  public headers: any;

  @prop({
    parser: { resolver: JSONParser() },
    populatable: [PopulateFrom.USER]
  })
  public queryParams: any;

  @prop({
    parser: { resolver: JSONParser() },
    populatable: [PopulateFrom.USER]
  })
  public body: any;
}
