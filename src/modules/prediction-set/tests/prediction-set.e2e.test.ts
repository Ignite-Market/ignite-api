import { HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { createBaseRoles } from '../../../../test/helpers/roles';
import { createBaseUsers, TestCredentials } from '../../../../test/helpers/user';
import { setupTest, Stage } from '../../../../test/setup';
import { releaseStage } from '../../../../test/setup-context-and-sql';
import { DbTables, SqlModelStatus } from '../../../config/types';
import { AUTHORIZATION_HEADER } from '../../../middlewares/authentication.middleware';
import { DataSource } from '../models/data-source.model';
import * as moment from 'moment';
import { PredictionSet } from '../models/prediction-set.model';

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
    let predictionId: number;
    afterEach(async () => {
      // await stage.db.paramExecute(`DELETE FROM \`${DbTables.OUTCOME}\``);
      // await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_GROUP}\``);
      // await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_SET}\``);
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
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.CREATED);

        expect(res.body.data.question).toBe(body.question);
        expect(res.body.data.initialPool).toBe(body.initialPool);
        expect(res.body.data.description).toBe(body.description);
        expect(res.body.data.generalResolutionDef).toBe(body.generalResolutionDef);
        expect(res.body.data.outcomeResolutionDef).toBe(body.outcomeResolutionDef);
        expect(res.body.data.outcomePriceDef).toBe(body.outcomePriceDef);
        expect(new Date(res.body.data.resolutionTime).getTime()).toBe(new Date(body.resolutionTime).getTime());
        expect(res.body.data.outcomes[0].name).toBe(body.predictionOutcomes[0].name);
        expect(res.body.data.outcomes[1].name).toBe(body.predictionOutcomes[1].name);
        predictionId = res.body.data.id;
      });

      it('Should update existing prediction set', async () => {
        const dataSourceIds = [];
        for (let i = 0; i < 3; i++) {
          const ds = await new DataSource({}, stage.context).insert();
          dataSourceIds.push(ds.id);
        }

        const body = {
          question: 'Bitcoin all time high by February 28?',
          initialPool: 1000,
          description: 'Bitcoin all time high prediction.',
          generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and February 28.',
          outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 28 Feb '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
          outcomePriceDef: 'The full outcome price always resolves to 100%.',
          startTime: new Date(),
          endTime: new Date(),
          resolutionTime: moment('2025-02-28 23:59').toDate(),
          predictionOutcomes: [
            {
              name: 'Yep'
            },
            {
              name: 'Nope'
            }
          ],
          dataSourceIds
        };

        const res = await request(stage.http)
          .put(`/prediction-sets/${predictionId}`)
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.id).toBe(predictionId);
        expect(res.body.data.question).toBe(body.question);
        expect(res.body.data.initialPool).toBe(body.initialPool);
        expect(res.body.data.description).toBe(body.description);
        expect(res.body.data.generalResolutionDef).toBe(body.generalResolutionDef);
        expect(res.body.data.outcomeResolutionDef).toBe(body.outcomeResolutionDef);
        expect(res.body.data.outcomePriceDef).toBe(body.outcomePriceDef);
        expect(new Date(res.body.data.resolutionTime).getTime()).toBe(new Date(body.resolutionTime).getTime());
        expect(res.body.data.outcomes[0].name).toBe(body.predictionOutcomes[0].name);
        expect(res.body.data.outcomes[1].name).toBe(body.predictionOutcomes[1].name);
      });

      it('Should delete existing prediction set', async () => {
        await request(stage.http)
          .delete(`/prediction-sets/${predictionId}`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.PREDICTION_SET}\` 
            WHERE id = @predictionId`,
          { predictionId }
        );

        expect(res[0].status).toBe(SqlModelStatus.DELETED);
      });
    });
  });
});
