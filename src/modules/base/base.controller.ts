import { Body, Controller, Get, Post } from '@nestjs/common';
import { BaseService } from './base.service';

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

  @Get('proxy-api-keys')
  getEncryptedApiKeys(): Promise<Array<{ identity_address: string; encrypted_API_key: string }>> {
    return this.baseService.getEncryptedApiKeys();
  }
}
