import { Context } from '../../../../context';
import { PredictionSetDto } from '../../dtos/prediction-set.dto';
import { Outcome } from '../../models/outcome.model';
import { PredictionSet, PredictionSetStatus } from '../../models/prediction-set.model';
import { PredictionSetService } from '../../prediction-set.service';

/**
 * Create new prediction set
 *
 * @param data Prediction data to use.
 */
export const createPredictionSet = async (context: Context, data?: PredictionSetDto): Promise<any> => {
  const body = {
    question: data?.question || 'Bitcoin all time high by January 31?',
    description: data?.description || 'Bitcoin all time high prediction.',
    generalResolutionDef:
      data?.generalResolutionDef || 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
    outcomeResolutionDef:
      data?.outcomeResolutionDef ||
      `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
    outcomePriceDef: data?.outcomePriceDef || 'The full outcome price always resolves to 100%.',
    startTime: data?.startTime || new Date(),
    endTime: data?.endTime || new Date(),
    resolutionTime: data?.resolutionTime || new Date(),
    predictionOutcomes: data?.predictionOutcomes || [
      {
        name: 'Yes'
      },
      {
        name: 'No'
      }
    ],
    dataSourceIds: data?.dataSourceIds || [],
    consensusThreshold: data?.dataSourceIds.length || 0
  };

  const predictionSet = new PredictionSet(body, context);
  predictionSet.outcomes = body.predictionOutcomes.map((d: any) => new Outcome(d, context));

  const prediction = await new PredictionSetService().createPredictionSet(predictionSet, body.dataSourceIds, context);
  if (data?.setStatus && data?.setStatus != PredictionSetStatus.INITIALIZED) {
    prediction.setStatus = data.setStatus;
    prediction.update();
  }

  return prediction;
};

export const createPredictionSets = async (quantity: number, context: Context): Promise<any[]> => {
  const predictions = [];
  for (let i = 0; i < quantity; i++) {
    const dto = new PredictionSetDto({ question: 'Question ' + i, setStatus: PredictionSetStatus.ACTIVE });
    predictions.push(await createPredictionSet(context, dto));
  }

  return predictions;
};
