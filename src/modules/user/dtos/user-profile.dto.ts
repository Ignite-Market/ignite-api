import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';

export class UserProfileDto extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.USER_PROFILE_DTO_USERNAME_NOT_PRESENT
      }
    ]
  })
  public username: string;
}
