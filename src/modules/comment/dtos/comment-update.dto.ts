import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { presenceValidator } from '@rawmodel/validators';
import { ModelBase } from '../../../lib/base-models/base';

export class CommentUpdateDto extends ModelBase {
  /**
   * Comment content.
   */
  @prop({
    parser: { resolver: stringParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_CONTENT_NOT_PRESENT
      }
    ]
  })
  public content: string;
}
