import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { env } from './config/env';
import { ExceptionsFilter } from './filters/exception.filter';
import { ResponseInterceptor } from './interceptors/response.interceptor';

export async function bootstrapModule(module: any) {
  const app = await NestFactory.create(module, { cors: true, rawBody: true });
  app.useGlobalFilters(new ExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.use(helmet());

  const host = env.API_HOST;
  const port = env.API_PORT;

  await app.listen(port, host);
  console.info(`Listening on ${host}:${port}`);
}

async function bootstrap() {
  await bootstrapModule(AppModule);
}

bootstrap().catch((err) => console.error(err.message));
