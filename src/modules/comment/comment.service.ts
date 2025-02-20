import { HttpStatus, Injectable } from '@nestjs/common';
import { Comment, DELETED_COMMENT_CONTENT } from './models/comment.model';
import { Context } from '../../context';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { CommentCreateDto } from './dtos/comment-create.dto';
import { CommentUpdateDto } from './dtos/comment-update.dto';
import {
  AuthorizationErrorCode,
  DefaultUserRole,
  ResourceNotFoundErrorCode,
  SerializeFor,
  SqlModelStatus,
  ValidatorErrorCode
} from '../../config/types';
import { CodeException, ValidationException } from '../../lib/exceptions/exceptions';
import { PredictionSet } from '../prediction-set/models/prediction-set.model';
import { User } from '../user/models/user.model';

@Injectable()
export class CommentService {
  /**
   * Creates a new comment.
   */
  async createComment(data: CommentCreateDto, context: Context): Promise<any> {
    const comment = new Comment(data.serialize(), context);
    comment.user_id = context.user.id;

    if (comment.parent_comment_id) {
      const parentComment = await new Comment({}, context).populateByIdAllowDeleted(comment.parent_comment_id);

      // Parent comment can be deleted, since we can still post in thread.
      if (!parentComment.exists()) {
        throw new CodeException({
          code: ResourceNotFoundErrorCode.COMMENT_DOES_NOT_EXISTS,
          errorCodes: ResourceNotFoundErrorCode,
          status: HttpStatus.NOT_FOUND,
          sourceFunction: `${this.constructor.name}/createComment`,
          context
        });
      }
    }

    const predictionSet = await new PredictionSet({}, context).populateById(comment.prediction_set_id);
    if (!predictionSet.exists() || !predictionSet.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.PREDICTION_SET_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/createComment`,
        context
      });
    }

    try {
      await comment.validate();
    } catch (error) {
      await comment.handle(error);

      if (!comment.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }
    await comment.insert();

    const returnComment = {
      ...comment.serialize(SerializeFor.USER),
      username: context.user.username,
      walletAddress: context.user.walletAddress
    };

    if (comment.reply_user_id) {
      const taggedUser = await new User({}, context).populateById(comment.reply_user_id);
      returnComment['taggedUserUsername'] = taggedUser.username;
    }

    return returnComment;
  }

  /**
   * Gets all comments for a prediction set.
   */
  async getCommentsByPredictionSetId(predictionSetId: number, query: BaseQueryFilter, context: Context): Promise<Comment[]> {
    return await new Comment({}, context).getList(predictionSetId, query);
  }

  /**
   * Updates a comment.
   */
  async updateComment(id: number, data: CommentUpdateDto, context: Context): Promise<Comment> {
    const comment = await new Comment({}, context).populateById(id);

    if (!comment.exists() || !comment.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.COMMENT_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/updateComment`,
        context
      });
    }

    if (comment.user_id !== context.user.id) {
      throw new CodeException({
        code: AuthorizationErrorCode.OWNERSHIP_MISMATCH,
        errorCodes: AuthorizationErrorCode,
        status: HttpStatus.FORBIDDEN,
        sourceFunction: `${this.constructor.name}/updateComment`,
        context
      });
    }

    comment.content = data.content;

    try {
      await comment.validate();
    } catch (error) {
      await comment.handle(error);

      if (!comment.isValid()) {
        throw new ValidationException(error, ValidatorErrorCode);
      }
    }

    await comment.update();
    return comment;
  }

  /**
   * Deletes a comment.
   * @param id Comment ID.
   * @param context Application context.
   * @returns Deleted comment.
   */
  async deleteComment(id: number, context: Context): Promise<any> {
    const comment = await new Comment({}, context).populateById(id);

    if (!comment.exists() || !comment.isEnabled()) {
      throw new CodeException({
        code: ResourceNotFoundErrorCode.COMMENT_DOES_NOT_EXISTS,
        errorCodes: ResourceNotFoundErrorCode,
        status: HttpStatus.NOT_FOUND,
        sourceFunction: `${this.constructor.name}/deleteComment`,
        context
      });
    }

    if (comment.user_id !== context.user.id && !(await context.hasRole(DefaultUserRole.ADMIN))) {
      throw new CodeException({
        code: AuthorizationErrorCode.OWNERSHIP_MISMATCH,
        errorCodes: AuthorizationErrorCode,
        status: HttpStatus.FORBIDDEN,
        sourceFunction: `${this.constructor.name}/updateComment`,
        context
      });
    }

    comment.status = SqlModelStatus.DELETED;
    await comment.update();

    comment.content = DELETED_COMMENT_CONTENT;
    return comment.serialize(SerializeFor.USER);
  }
}
