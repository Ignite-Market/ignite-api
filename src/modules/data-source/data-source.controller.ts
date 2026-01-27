import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DefaultUserRole, SerializeFor } from '../../config/types';
import { Context } from '../../context';
import { Ctx } from '../../decorators/context.decorator';
import { Roles } from '../../decorators/role.decorator';
import { Validation } from '../../decorators/validation.decorator';
import { AuthGuard } from '../../guards/auth.guard';
import { ValidationGuard } from '../../guards/validation.guard';
import { DataSourceService } from './data-source.service';
import { DataSourceDto } from './dtos/data-source.dto';
import { TestJqDto } from './dtos/test-jq.dto';
import { DataSource } from '../prediction-set/models/data-source.model';

@Controller('data-sources')
export class DataSourceController {
  constructor(private readonly dataSourceService: DataSourceService) {}

  @Post()
  @Validation({ dto: DataSourceDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async createDataSource(@Body() data: any, @Ctx() context: Context) {
    const dataSource = new DataSource(data, context);
    return (await this.dataSourceService.createDataSource(dataSource, context)).serialize(SerializeFor.USER);
  }

  @Post('test-jq')
  @Validation({ dto: TestJqDto })
  @UseGuards(ValidationGuard, AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async testJqQuery(@Body() data: TestJqDto, @Ctx() context: Context) {
    return await this.dataSourceService.testJqQuery(data, context);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(DefaultUserRole.ADMIN)
  async getDataSources(@Ctx() context: Context) {
    return await this.dataSourceService.getDataSources(context);
  }
}
