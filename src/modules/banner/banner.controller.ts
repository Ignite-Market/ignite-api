import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { DefaultUserRole, SerializeFor, ValidateFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { BannerService } from './banner.service';
import { Banner } from './models/banner';
import { BaseQueryFilter } from '../../lib/base-models/base-query-filter.model';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @Validation({ dto: Banner })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createBanner(@Body() data: any, @Ctx() context: Context) {
    const banner = new Banner(data.serialize(), context);

    return (await this.bannerService.createBanner(banner, context)).serialize(SerializeFor.USER);
  }

  @Get()
  async getBanners(@Ctx() context: Context) {
    return await this.bannerService.getBanners(context);
  }

  @Get('/admin')
  @Validation({ dto: BaseQueryFilter, validateFor: ValidateFor.QUERY })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async getBannersAdmin(@Query() query: BaseQueryFilter, @Ctx() context: Context) {
    return await this.bannerService.getBannersAdmin(query, context);
  }

  @Put('/:id')
  @Validation({ dto: Banner })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async updateBanner(@Param('id') id: number, @Body() data: Banner, @Ctx() context: Context) {
    return (await this.bannerService.updateBanner(id, data, context)).serialize(SerializeFor.USER);
  }

  @Patch('/:id/toggle')
  @Validation({ dto: Banner })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async toggleBanner(@Param('id') id: number, @Ctx() context: Context) {
    return (await this.bannerService.toggleBanner(id, context)).serialize(SerializeFor.USER);
  }

  @Delete('/:id')
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async deleteBanner(@Param('id') id: number, @Ctx() context: Context) {
    return await this.bannerService.deleteBanner(id, context);
  }
}
