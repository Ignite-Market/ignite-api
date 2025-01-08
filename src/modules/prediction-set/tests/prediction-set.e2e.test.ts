import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createBaseRoles } from '../../../../test/helpers/roles';
import { createBaseUsers, TestCredentials } from '../../../../test/helpers/user';
import { setupTest, Stage } from '../../../../test/setup';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import { DbTables } from '../../../config/types';
import { AUTHORIZATION_HEADER } from '../../../middlewares/authentication.middleware';
import { DataSource } from '../models/data-source.model';

describe('User e2e tests', () => {
  let stage: Stage;
  let cred: TestCredentials;

  beforeAll(async () => {
    stage = await setupTest();
    await createBaseRoles(stage.context);
    cred = await createBaseUsers(stage.context);
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('Prediction set e2e tests', () => {
    afterEach(async () => {
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.OUTCOME}\``);
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_GROUP}\``);
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_SET}\``);
    });

    describe('POST /prediction-sets - Create prediction set tests', () => {
      it('Should create new prediction set', async () => {
        const dataSourceIds = [];
        for (let i = 0; i < 3; i++) {
          const ds = await new DataSource({}, stage.context).insert();
          dataSourceIds.push(ds.id);
        }

        const body = {
          question: 'Bitcoin all time high by January 31?',
          initialPool: 1000,
          description: 'Bitcoin all time high prediction.',
          generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
          outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
          outcomePriceDef: 'The full outcome price always resolves to 100%.',
          startTime: new Date(),
          endTime: new Date(),
          resolutionTime: new Date(),
          predictionOutcomes: [
            {
              name: 'Yes'
            },
            {
              name: 'No'
            }
          ],
          dataSourceIds
        };

        const res = await request(stage.http)
          .post('/prediction-sets')
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken);
        // .expect(HttpStatus.CREATED);

        console.log(res.body);
      });
    });
  });
});
