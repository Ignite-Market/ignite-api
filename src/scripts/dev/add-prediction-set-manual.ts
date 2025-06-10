import { addPredictionSet } from '../../lib/blockchain';
import { createContext } from '../../lib/utils';
import { Outcome } from '../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../modules/prediction-set/prediction-set.service';

const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const bitcoin = {
  collateral_token_id: 1,
  question: 'Bitcoin all time high by March 31?',
  description: 'Bitcoin all time high prediction.',
  generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
  outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    },
    {
      name: 'Maybe',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/maybe.svg'
    }
  ]
};

const xrp1 = {
  collateral_token_id: 1,
  question: 'Will the SEC and Ripple finalize a settlement by June 15, 2025?',
  description: `
    Ripple Labs and the U.S. Securities and Exchange Commission (SEC) are currently in a paused legal battle, entering 
    a 60-day window for potential settlement talks. A resolution could have major implications for the regulatory 
    treatment of XRP and other digital assets.
    Market will resolve:
    "Yes" if a formal legal settlement is filed in court or announced in an official joint statement on or before June 15, 2025.
    "No" if no settlement is made public by that date and litigation continues.
    "Postponed" if both parties request or receive an official extension that delays proceedings beyond June 15, 2025.
    `,
  generalResolutionDef: 'This market will resolve to "Yes" if Bitcoin reaches the all time high between December 30 and January 31.',
  outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    },
    {
      name: 'Postponed',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/maybe.svg'
    }
  ]
};

const xrp2 = {
  collateral_token_id: 1,
  question: 'Will XRP maintain a price above $2.00 through May 2025?',
  description: `
    The $2.00 mark has become a key technical level for XRP, with investors watching closely for signs of strength or 
    breakdown. Performance here may signal broader investor confidence or weakness.
    Market will resolve:
    "Yes" if XRP does not close below $2.00 on any day in May 2025 (based on CoinMarketCap daily closing price).
    "No" if XRP closes below $2.00 and remains below it for the rest of the month.
    `,
  generalResolutionDef: '"Yes" if XRP does not close below $2.00 on any day in May 2025 (based on CoinMarketCap daily closing price).',
  outcomeResolutionDef: `"No" if XRP closes below $2.00 and remains below it for the rest of the month.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    }
  ]
};

const xrp3 = {
  collateral_token_id: 1,
  question: 'Will the SEC approve at least one major crypto ETF under Paul Atkins by Q3 2025?',
  description: `
    With Paul Atkins taking over as SEC Chair, there’s speculation that a more crypto-friendly stance could lead to 
    approval of ETFs for top tokens like ETH, XRP, or BTC. This could trigger a new wave of institutional involvement.
    Market will resolve:
    "Yes" if any spot ETF for a major cryptocurrency (BTC, ETH, XRP, etc.) is approved by September 30, 2025.
    "No" if no such ETF is approved by that date.
    "Regulation Shift" if the SEC publishes new ETF-related guidance or frameworks but no approval is granted.
    `,
  generalResolutionDef: '"Yes" if any spot ETF for a major cryptocurrency (BTC, ETH, XRP, etc.) is approved by September 30, 2025.',
  outcomeResolutionDef: `"Yes" if any spot ETF for a major cryptocurrency (BTC, ETH, XRP, etc.) is approved by September 30, 2025.`,
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    },
    {
      name: 'Regulation Shift',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/maybe.svg'
    }
  ]
};

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(xrp3, context);
    ps.outcomes = xrp3.predictionOutcomes.map((d) => new Outcome(d, context));

    // Create prediction set.
    const predictionSet = await service.createPredictionSet(ps, [], context);

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
