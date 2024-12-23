import { HttpServer } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Context } from '../src/context';
import { MySql } from '../src/lib/database/mysql';
import { env } from '../src/config/env';
import { AppEnvironment } from '../src/config/types';
import { rebuildTestDatabases } from './migrations';
import { AppModule } from '../src/app.module';
import { ExceptionsFilter } from '../src/filters/exception.filter';
import { ResponseInterceptor } from '../src/interceptors/response.interceptor';
import { setupTestContextAndSql } from './setup-context-and-sql';

export interface Stage {
  app: INestApplication;
  http: HttpServer;
  db: MySql;
  context: Context;
}

/**
 * Setup test environment. Rebuild BD, run test app and create test stage object
 * @returns
 */
export async function setupTest(apiPort = env.API_PORT_TEST, apiHost = env.API_HOST_TEST): Promise<Stage> {
  let app = null;
  let http: HttpServer = null;

  env.APP_ENV = AppEnvironment.TEST;

  env.MYSQL_HOST = null; // safety

  try {
    await rebuildTestDatabases();
  } catch (err) {
    console.error(err);
    throw new Error(`rebuildTestDatabases failed: ${err}`);
  }

  try {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new ExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();

    // await app.listen(apiPort, apiHost);
    http = app.getHttpServer().listen(0);

    const stage: Stage = await setupTestContextAndSql();
    stage.app = app;
    stage.http = http;

    return stage;
  } catch (e) {
    console.error(e);
    throw new Error(`Unable to set up env: ${e}`);
  }
}
