import { Inject, Module } from '@nestjs/common';
import { MySql } from '../../lib/database/mysql';
import { getMySqlClient } from '../../lib/database/sql-utils';

@Module({
  providers: [
    {
      provide: 'MYSQL_DB',
      useFactory: async (): Promise<MySql> => {
        return await getMySqlClient();
      }
    }
  ],
  exports: ['MYSQL_DB']
})
export class MySQLModule {
  constructor(@Inject('MYSQL_DB') private mysql: MySql) {}

  async onModuleDestroy() {
    await this.mysql.close();
  }
}
