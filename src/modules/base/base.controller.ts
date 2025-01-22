import { Controller, Get } from '@nestjs/common';
import { BaseService } from './base.service';

@Controller()
export class BaseController {
  constructor(private readonly baseService: BaseService) {}

  @Get()
  getRoot(): any {
    return this.baseService.getRoot();
  }
}
