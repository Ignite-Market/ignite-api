import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { JSONParser } from '../../../lib/parsers';
import { ModelBase } from '../../../lib/base-models/base';

export class DataSourceDto extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.DATA_SOURCE_ENDPOINT_NOT_PRESENT
      }
    ]
  })
  public endpoint: string;

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
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.DATA_SOURCE_ABI_NOT_PRESENT
      }
    ]
  })
  public abi: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public httpMethod: string;

  @prop({
    parser: { resolver: JSONParser() },
    populatable: [PopulateFrom.USER]
  })
  public body: any;

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
}
