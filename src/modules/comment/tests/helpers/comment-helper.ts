import { Context } from '../../../../context';
import { User } from '../../../user/models/user.model';
import { CommentService } from '../../comment.service';
import { CommentCreateDto } from '../../dtos/comment-create.dto';
import { CommentEntityTypes } from '../../models/comment.model';

export const createComment = async (
  context: Context,
  entityId: number,
  entityType: CommentEntityTypes,
  userId: number,
  parentCommentId?: number,
  replyUserId?: number
) => {
  const body = {
    entity_id: entityId,
    entityType,
    parent_comment_id: parentCommentId,
    reply_user_id: replyUserId,
    content: `Test comment ${Date.now()}`
  };
  context.user = new User({ id: userId }, context);
  const comment = new CommentCreateDto(body, context);
  return await new CommentService().createComment(comment, context);
};

export const createComments = async (count: number, context: Context, entityId: number, entityType: CommentEntityTypes, userId?: number) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    comments.push(await createComment(context, entityId, entityType, userId));
  }
  return comments;
};
