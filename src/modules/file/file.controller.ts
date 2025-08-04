import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { DefaultUserRole } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { FileService } from './file.service';
import { Roles } from '../../decorators/role.decorator';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('image')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createProposal(@Body() file: any, @Ctx() context: Context) {
    return await this.fileService.generateUploadUrl(file, context);
  }
}
