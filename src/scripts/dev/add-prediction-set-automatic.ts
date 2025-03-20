import { env } from '../../config/env';
import { addPredictionSet } from '../../lib/blockchain';
import { DataSource } from '../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../modules/prediction-set/prediction-set.service';
import { createContext } from './context';

const tenMinutes = 10 * 60 * 1000;
const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const data = {
  question: 'Bitcoin all time high by March 31?',
  description: 'Bitcoin all time high prediction.',
  generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
  outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date())),
  endTime: new Date(Number(new Date()) + tenMinutes / 2),
  resolutionTime: new Date(Number(new Date()) + 3 * tenMinutes),
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  tags: 'github',
  predictionOutcomes: [
    {
      name: 'Yes'
    },
    {
      name: 'No'
    },
    {
      name: 'Maybe'
    }
  ]
};

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(data, context);
    ps.outcomes = data.predictionOutcomes.map((d) => new Outcome(d, context));

    const dataSourceIds = [];
    if (data.resolutionType === ResolutionType.AUTOMATIC) {
      // Add data sources.

      const id = Number(new Date());
      for (let i = 1; i <= 3; i++) {
        const ds = await new DataSource(
          {
            endpoint: `${env.MOCK_RESULTS_API_ENDPOINT}/?apiId=${id + i}`,
            jqQuery: '.result',
            abi: {
              'type': 'uint256'
            }
            // TODO: Should abi be on the response body or just the end value.
            // abi: {
            //   'components': [
            //     {
            //       'internalType': 'uint256',
            //       'name': 'result',
            //       'type': 'uint256'
            //     },
            //     {
            //       'internalType': 'uint256',
            //       'name': 'apiId',
            //       'type': 'uint256'
            //     }
            //   ],
            //   'name': 'response',
            //   'type': 'tuple'
            // }
          },
          context
        ).insert();

        dataSourceIds.push(ds.id);
      }
    }

    // Create prediction set.
    const predictionSet = await service.createPredictionSet(ps, dataSourceIds, context);

    // Add prediction set to blockchain.
    await addPredictionSet(predictionSet, context);
  } catch (error) {
    console.log(error);
  }
};

processPredictionSet()
  .then(() => {
    console.log('Complete!');
    process.exit(0);
  })
  .catch(console.error);
