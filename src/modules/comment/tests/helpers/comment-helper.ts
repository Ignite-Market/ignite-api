import { Context } from '../../../../context';
import { User } from '../../../user/models/user.model';
import { CommentService } from '../../comment.service';
import { CommentCreateDto } from '../../dtos/comment-create.dto';

export const createComment = async (context: Context, predictionSetId: number, userId: number, parentCommentId?: number) => {
  const body = {
    prediction_set_id: predictionSetId,
    parent_comment_id: parentCommentId,
    content: `Test comment ${Date.now()}`
  };
  context.user = new User({ id: userId }, context);
  const comment = new CommentCreateDto(body, context);
  return await new CommentService().createComment(comment, context);
};

export const createComments = async (count: number, context: Context, predictionSetId: number, userId?: number) => {
  const comments = [];
  for (let i = 0; i < count; i++) {
    comments.push(await createComment(context, predictionSetId, userId));
  }
  return comments;
};
