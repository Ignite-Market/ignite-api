import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ContextMiddleware } from './middlewares/context.middleware';
import { AuthenticateUserMiddleware } from './middlewares/authentication.middleware';
import { MySQLModule } from './modules/database/mysql.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [MySQLModule, UserModule],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(AuthenticateUserMiddleware)
      .exclude(
        // App routes:
        { path: '/', method: RequestMethod.GET },
        { path: '/favicon.ico', method: RequestMethod.GET },
        // Auth routes:
        { path: 'users/login', method: RequestMethod.POST },
        { path: 'users/register', method: RequestMethod.POST },
        { path: 'users/validate-email', method: RequestMethod.POST },
        { path: 'users/password-reset', method: RequestMethod.POST },
        { path: 'users/password-reset-request', method: RequestMethod.POST }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
    // consumer
    //   .apply(createRequestLogMiddleware(ApiName.DASHBOARD_API))
    //   .exclude(
    //     { path: '*', method: RequestMethod.HEAD },
    //     { path: '*', method: RequestMethod.OPTIONS },
    //   )
    //   .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
