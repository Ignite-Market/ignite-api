import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { presenceValidator } from '@rawmodel/validators';
import { ModelBase } from '../../../lib/base-models/base';

export class CommentCreateDto extends ModelBase {
  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_PREDICTION_SET_ID_NOT_PRESENT
      }
    ]
  })
  public prediction_set_id: number;

  /**
   * Parent comment ID for replies.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER]
  })
  public parent_comment_id: number;

  /**
   * Reply user ID for replies.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER]
  })
  public reply_user_id: number;

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
