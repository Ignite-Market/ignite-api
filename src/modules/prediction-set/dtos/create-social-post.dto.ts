import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { arrayLengthValidator, presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';

export class CreateSocialPostDto extends ModelBase {
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREATE_SOCIAL_POST_MESSAGE_NOT_PRESENT
      }
    ]
  })
  public message: string;

  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER]
  })
  public imgLink: string;

  @prop({
    parser: { resolver: stringParser(), array: true },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.CREATE_SOCIAL_POST_SOCIAL_MEDIAS_NOT_PRESENT
      },
      {
        resolver: arrayLengthValidator({ minOrEqual: 1 }),
        code: ValidatorErrorCode.CREATE_SOCIAL_POST_SOCIAL_MEDIAS_INVALID
      }
    ]
  })
  public socialMedias: string[];
}
