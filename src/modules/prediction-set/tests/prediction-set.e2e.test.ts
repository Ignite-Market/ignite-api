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
import { createPredictionSet, createPredictionSets } from './helpers/prediction-helper';
import { PredictionSet, PredictionSetStatus } from '../models/prediction-set.model';

describe('Prediction set e2e tests', () => {
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
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.PREDICTION_SET_DATA_SOURCE}\``);
      await stage.db.paramExecute(`DELETE FROM \`${DbTables.DATA_SOURCE}\``);
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
          consensusThreshold: 60,
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
        expect(res.body.data.description).toBe(body.description);
        expect(res.body.data.generalResolutionDef).toBe(body.generalResolutionDef);
        expect(res.body.data.outcomeResolutionDef).toBe(body.outcomeResolutionDef);
        expect(res.body.data.outcomePriceDef).toBe(body.outcomePriceDef);
        expect(new Date(res.body.data.resolutionTime).getTime()).toBe(new Date(body.resolutionTime).getTime());
        expect(res.body.data.outcomes[0].name).toBe(body.predictionOutcomes[0].name);
        expect(res.body.data.outcomes[1].name).toBe(body.predictionOutcomes[1].name);
      });

      it('Should not create prediction set if user is not admin', async () => {
        const dataSourceIds = [];
        for (let i = 0; i < 3; i++) {
          const ds = await new DataSource({}, stage.context).insert();
          dataSourceIds.push(ds.id);
        }

        const body = {
          question: 'Bitcoin all time high by January 31?',
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
          consensusThreshold: 60,
          dataSourceIds
        };

        await request(stage.http)
          .post('/prediction-sets')
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('GET /prediction-sets - Get prediction set tests', () => {
      it('Should get prediction sets', async () => {
        const predictions = await createPredictionSets(3, stage.context);
        const res = await request(stage.http)
          .get('/prediction-sets')
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.total).toBe(3);
        expect(res.body.data.items).toHaveLength(3);
        expect(res.body.data.items[0].outcomes).toHaveLength(2);
        expect(res.body.data.items[0].question).toBe(predictions[0].question);
        expect(res.body.data.items[1].question).toBe(predictions[1].question);
        expect(res.body.data.items[2].question).toBe(predictions[2].question);
      });

      it('Should not display prediction sets if not active', async () => {
        const predictions = await createPredictionSets(3, stage.context);

        await new PredictionSet({ ...predictions[0], setStatus: PredictionSetStatus.INITIALIZED }, stage.context).update();
        await new PredictionSet({ ...predictions[1], status: SqlModelStatus.DELETED }, stage.context).update();

        const res = await request(stage.http)
          .get('/prediction-sets')
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.total).toBe(1);
        expect(res.body.data.items).toHaveLength(1);
        expect(res.body.data.items[0].outcomes).toHaveLength(2);
        expect(res.body.data.items[0].question).toBe(predictions[2].question);
      });
    });

    describe('PUT /prediction-sets/:id - Update prediction set tests', () => {
      it('Should update existing prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);
        const dataSourceIds = [];
        for (let i = 0; i < 3; i++) {
          const ds = await new DataSource({}, stage.context).insert();
          dataSourceIds.push(ds.id);
        }

        const body = {
          question: 'Bitcoin all time high by February 28?',
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
          .put(`/prediction-sets/${prediction.id}`)
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        expect(res.body.data.id).toBe(prediction.id);
        expect(res.body.data.question).toBe(body.question);
        expect(res.body.data.description).toBe(body.description);
        expect(res.body.data.generalResolutionDef).toBe(body.generalResolutionDef);
        expect(res.body.data.outcomeResolutionDef).toBe(body.outcomeResolutionDef);
        expect(res.body.data.outcomePriceDef).toBe(body.outcomePriceDef);
        expect(new Date(res.body.data.resolutionTime).getTime()).toBe(new Date(body.resolutionTime).getTime());
        expect(res.body.data.outcomes[0].name).toBe(body.predictionOutcomes[0].name);
        expect(res.body.data.outcomes[1].name).toBe(body.predictionOutcomes[1].name);
      });

      it('Should not update prediction set if user is not admin', async () => {
        const prediction = await createPredictionSet(stage.context);
        const dataSourceIds = [];
        for (let i = 0; i < 3; i++) {
          const ds = await new DataSource({}, stage.context).insert();
          dataSourceIds.push(ds.id);
        }

        const body = {
          question: 'Bitcoin all time high by February 28?',
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

        await request(stage.http)
          .put(`/prediction-sets/${prediction.id}`)
          .send(body)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('PATCH /prediction-sets/:id/process - Process prediction set tests', () => {
      it.only('Should start processing initialized prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);

        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/process`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.PREDICTION_SET}\` 
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        expect(res[0].setStatus).toBe(PredictionSetStatus.ACTIVE);
      });

      it('Should not start processing active prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);

        await stage.db.paramExecute(
          `
            UPDATE \`${DbTables.PREDICTION_SET}\` 
            SET setStatus = ${PredictionSetStatus.ACTIVE}
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );
        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/process`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('Should not start processing prediction set if user is not admin', async () => {
        const prediction = await createPredictionSet(stage.context);

        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/process`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('PATCH /prediction-sets/:id/cancel - Cancel prediction set tests', () => {
      it('Should cancel pending prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);
        await stage.db.paramExecute(
          `
            UPDATE \`${DbTables.PREDICTION_SET}\` 
            SET setStatus = ${PredictionSetStatus.PENDING}
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );
        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/cancel`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.PREDICTION_SET}\` 
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        expect(res[0].setStatus).toBe(PredictionSetStatus.INITIALIZED);
      });

      it('Should cancel active prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);

        await stage.db.paramExecute(
          `
            UPDATE \`${DbTables.PREDICTION_SET}\` 
            SET setStatus = ${PredictionSetStatus.ACTIVE}
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/cancel`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.PREDICTION_SET}\` 
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        expect(res[0].setStatus).toBe(PredictionSetStatus.INITIALIZED);
      });

      it('Should not cancel prediction set if user is not admin', async () => {
        const prediction = await createPredictionSet(stage.context);

        await stage.db.paramExecute(
          `
            UPDATE \`${DbTables.PREDICTION_SET}\` 
            SET setStatus = ${PredictionSetStatus.PENDING}
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        await request(stage.http)
          .patch(`/prediction-sets/${prediction.id}/cancel`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /prediction-sets/:id - Delete prediction set tests', () => {
      it('Should delete existing prediction set', async () => {
        const prediction = await createPredictionSet(stage.context);

        await request(stage.http)
          .delete(`/prediction-sets/${prediction.id}`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.adminUserToken)
          .expect(HttpStatus.OK);

        const res = await stage.db.paramExecute(
          `
            SELECT * FROM \`${DbTables.PREDICTION_SET}\` 
            WHERE id = @predictionId`,
          { predictionId: prediction.id }
        );

        expect(res[0].status).toBe(SqlModelStatus.DELETED);
      });

      it('Should not delete prediction set if user is not admin', async () => {
        const prediction = await createPredictionSet(stage.context);

        await request(stage.http)
          .delete(`/prediction-sets/${prediction.id}`)
          .set('Content-Type', 'application/json')
          .set('Accept', 'application/json')
          .set(AUTHORIZATION_HEADER, cred.userToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });
  });
});
