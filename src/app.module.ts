import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthenticateUserMiddleware } from './middlewares/authentication.middleware';
import { ContextMiddleware } from './middlewares/context.middleware';
import { BaseModule } from './modules/base/base.module';
import { CollateralTokenModule } from './modules/collateral-token/collateral-token.module';
import { CommentModule } from './modules/comment/comment.module';
import { MySQLModule } from './modules/database/mysql.module';
import { PredictionSetModule } from './modules/prediction-set/prediction-set.module';
import { ProposalModule } from './modules/proposal/proposal.module';
import { RewardPointsModule } from './modules/reward-points/reward-points.module';
import { StatsModule } from './modules/stats/stats.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    MySQLModule,
    UserModule,
    PredictionSetModule,
    CommentModule,
    BaseModule,
    ProposalModule,
    RewardPointsModule,
    CollateralTokenModule,
    StatsModule
  ],
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
        // Public listings:
        // { path: 'prediction-sets', method: RequestMethod.GET },
        // { path: 'prediction-sets/:id', method: RequestMethod.GET },
        // { path: 'comments/prediction-sets/:id', method: RequestMethod.GET }
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
