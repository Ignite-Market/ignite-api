import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthenticateUserMiddleware } from './middlewares/authentication.middleware';
import { ContextMiddleware } from './middlewares/context.middleware';
import { BaseModule } from './modules/base/base.module';
import { CommentModule } from './modules/comment/comment.module';
import { MySQLModule } from './modules/database/mysql.module';
import { PredictionSetModule } from './modules/prediction-set/prediction-set.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [MySQLModule, UserModule, PredictionSetModule, CommentModule, BaseModule],
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
