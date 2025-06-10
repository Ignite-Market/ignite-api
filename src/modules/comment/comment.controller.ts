import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';
import { CommentService } from './comment.service';
import { CommentCreateDto } from './dtos/comment-create.dto';
import { CommentUpdateDto } from './dtos/comment-update.dto';
import { Comment } from './models/comment.model';
import { CommentsQueryFilter } from './dtos/comments-query-filter';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @Validation({ dto: CommentCreateDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async create(@Body() data: CommentCreateDto, @Ctx() context: Context): Promise<any> {
    return await this.commentService.createComment(data, context);
  }

  @Get()
  @Validation({ dto: CommentsQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard)
  async getComments(@Query() query: CommentsQueryFilter, @Ctx() context: Context): Promise<Comment[]> {
    return this.commentService.getComments(query, context);
  }

  @Put(':id')
  @Validation({ dto: CommentUpdateDto })
  @UseGuards(AuthGuard, ValidationGuard)
  async update(@Param('id') id: number, @Body() data: CommentUpdateDto, @Ctx() context: Context): Promise<Comment> {
    return this.commentService.updateComment(id, data, context);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: number, @Ctx() context: Context): Promise<any> {
    return this.commentService.deleteComment(id, context);
  }
}
