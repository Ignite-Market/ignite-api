import { prop } from '@rawmodel/core';
import { booleanParser } from '@rawmodel/parsers';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { presenceValidator } from '@rawmodel/validators';

export class UpdateHideStateDto extends BaseQueryFilter {
  @prop({
    parser: { resolver: booleanParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.PREDICTION_SET_HIDE_STATE_NOT_PRESENT
      }
    ]
  })
  public hide: boolean;
}
