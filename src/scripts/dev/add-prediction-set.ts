import { addPredictionSet } from '../../lib/blockchain';
import { DataSource } from '../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../modules/prediction-set/prediction-set.service';
import { createContext } from './context';

const data = {
  question: 'Bitcoin all time high by January 31?',
  description: 'Bitcoin all time high prediction.',
  generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
  outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(),
  endTime: new Date(),
  resolutionTime: new Date(),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes'
    },
    {
      name: 'No'
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
      for (let i = 0; i < 3; i++) {
        const ds = await new DataSource(
          {
            endpoint: 'https://endpoint/' + i,
            jqQuery: 'JQ query ' + i,
            abi: 'ABI ' + i
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
