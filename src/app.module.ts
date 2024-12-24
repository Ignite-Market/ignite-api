import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ContextMiddleware } from './middlewares/context.middleware';
import { AuthenticateUserMiddleware } from './middlewares/authentication.middleware';
import { MySQLModule } from './modules/database/mysql.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [MySQLModule, UserModule],
  controllers: [],
  providers: []
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
    consumer
      .apply(AuthenticateUserMiddleware)
      .exclude(
        // App routes:
        { path: '/', method: RequestMethod.GET },
        { path: '/favicon.ico', method: RequestMethod.GET },
        // Auth routes:
        { path: 'users/wallet-message', method: RequestMethod.GET },
        { path: 'users/wallet-login', method: RequestMethod.POST }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
