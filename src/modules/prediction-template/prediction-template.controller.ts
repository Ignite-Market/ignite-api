import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DefaultUserRole } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { PredictionTemplateService } from './prediction-template.service';
import { GenerateFromTemplateDto } from './dtos/generate-from-template.dto';

@Controller('prediction-templates')
export class PredictionTemplateController {
  constructor(private readonly templateService: PredictionTemplateService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async getTemplates(@Ctx() context: Context) {
    return await this.templateService.getTemplates();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async getTemplateById(@Param('id') id: string, @Ctx() context: Context) {
    const template = await this.templateService.getTemplateById(id);
    if (!template) {
      return null;
    }
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      imgUrl: template.imgUrl,
      variables: template.variables
    };
  }

  @Post(':id/generate')
  @Validation({ dto: GenerateFromTemplateDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async generateFromTemplate(@Param('id') id: string, @Body() variables: GenerateFromTemplateDto, @Ctx() context: Context) {
    return await this.templateService.generateFromTemplate(id, variables, context);
  }
}
