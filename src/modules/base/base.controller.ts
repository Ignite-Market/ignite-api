import { Body, Controller, Get, Post } from '@nestjs/common';
import { BaseService } from './base.service';
import { Ctx } from '../../decorators/context.decorator';
import { Context } from '../../context';

@Controller()
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Get()
  getRoot(): any {
    return this.baseService.getRoot();
  }

  @Post('siteverify')
  getSiteVerify(@Body() data: any): Promise<boolean> {
    return this.baseService.getSiteVerify(data);
  }
}
