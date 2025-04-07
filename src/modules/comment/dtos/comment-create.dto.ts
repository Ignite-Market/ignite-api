import { prop } from '@rawmodel/core';
import { integerParser, stringParser } from '@rawmodel/parsers';
import { presenceValidator } from '@rawmodel/validators';
import { PopulateFrom, SerializeFor, ValidatorErrorCode } from '../../../config/types';
import { ModelBase } from '../../../lib/base-models/base';
import { enumInclusionValidator } from '../../../lib/validators';
import { CommentEntityTypes } from '../models/comment.model';

export class CommentCreateDto extends ModelBase {
  /**
   * Entity ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_ENTITY_ID_NOT_PRESENT
      }
    ]
  })
  public entity_id: number;

  /**
   * Entity type.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    serializable: [SerializeFor.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_ENTITY_ID_NOT_PRESENT
      },
      {
        resolver: enumInclusionValidator(CommentEntityTypes),
        code: ValidatorErrorCode.COMMENT_ENTITY_TYPE_NOT_VALID
      }
    ]
  })
  public entityType: number;

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
