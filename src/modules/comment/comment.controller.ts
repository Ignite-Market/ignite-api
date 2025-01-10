import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { Comment } from './models/comment.model';
import { AuthGuard } from '../../guards/auth.guard';
import { Ctx } from '../../decorators/context.decorator';
import { Context } from '../../context';
import { CommentService } from './comment.service';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { ValidationGuard } from '../../guards/validation.guard';
import { Validation } from '../../decorators/validation.decorator';
import { SerializeFor, ValidateFor } from '../../config/types';
import { CommentCreateDto } from './dtos/comment-create.dto';
import { CommentUpdateDto } from './dtos/comment-update.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Validation({ dto: CommentCreateDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async create(@Body() data: CommentCreateDto, @Ctx() context: Context): Promise<any> {
    return (await this.commentService.createComment(data, context)).serialize(SerializeFor.USER);
  }

  @Get('prediction-set/:predictionSetId')
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(AuthGuard, ValidationGuard)
  async getByPredictionSetId(
    @Param('predictionSetId') predictionSetId: number,
    @Query() query: BaseQueryFilter,
    @Ctx() context: Context
  ): Promise<Comment[]> {
    return this.commentService.getCommentsByPredictionSetId(predictionSetId, query, context);
  }

  @Put(':id')
  @Validation({ dto: CommentUpdateDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async update(@Param('id') id: number, @Body() data: CommentUpdateDto, @Ctx() context: Context): Promise<Comment> {
    return this.commentService.updateComment(id, data, context);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: number, @Ctx() context: Context): Promise<void> {
    return this.commentService.deleteComment(id, context);
  }
}
