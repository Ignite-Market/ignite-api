import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { PopulateFrom, ValidatorErrorCode } from '../../../config/types';
import { BaseQueryFilter } from '../../../lib/base-models/base-query-filter.model';
import { presenceValidator } from '@rawmodel/validators';
import { enumInclusionValidator } from '../../../lib/validators';
import { CommentEntityTypes } from '../models/comment.model';

export class CommentsQueryFilter extends BaseQueryFilter {
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
    validators: [
      {
        resolver: presenceValidator(),
        code: ValidatorErrorCode.COMMENT_ENTITY_ID_NOT_PRESENT
      }
    ]
  })
  public entityId: number;

  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.USER],
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
  public entityType: CommentEntityTypes;
}
