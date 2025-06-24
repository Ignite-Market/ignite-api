import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';

const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const bitcoin = {
  collateral_token_id: 1,
  question: 'Bitcoin all time high by March 31?',
  outcomeResolutionDef: `This market will resolve to "Yes" if any Binance 1 minute candle for BTCUSDT between 30 Dec '24 11:00 and 31 Jan '25 23:59 in the ET timezone has a final “high” price that is higher than any previous Binance 1 minute candle's "high" price on any prior date. Otherwise, this market will resolve to "No". The resolution source for this market is Binance, specifically the BTCUSDT "high" prices currently available at https://www.binance.com/en/trade/BTC_USDT with “1m” and “Candles” selected on the top bar. Please note that this market is about the price according to Binance BTCUSDT, not according to other sources or spot markets.`,
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
  question: 'Will the SEC and Ripple finalize a settlement by Avgust 30, 2025?',
  outcomeResolutionDef: `"Yes" if a formal legal settlement is filed in court or announced in an official joint statement on or before Avgust 30, 2025.
"No" if no settlement is made public by that date and litigation continues.
"Postponed" if both parties request or receive an official extension that delays proceedings beyond Avgust 30, 2025.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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
  question: 'Will the SEC approve an XRP spot ETF by Avgust 30, 2025?',
  outcomeResolutionDef: `"Approved" if the SEC publishes a formal approval for any XRP spot ETF before or on Avgust 30, 2025. 
"Denied" if the SEC formally rejects all proposals by that date. 
"Delayed" if the SEC pushes its decision deadline beyond May 22, 2025 through official communication.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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
      name: 'Delayed',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/maybe.svg'
    }
  ]
};

const xrp3 = {
  collateral_token_id: 1,
  question: 'Will the SEC approve at least one major crypto ETF under Paul Atkins by Q3 2025?',
  outcomeResolutionDef: `"Yes" if any spot ETF for a major cryptocurrency (BTC, ETH, XRP, etc.) is approved by September 30, 2025.
"No" if no such ETF is approved by that date.
"Regulation Shift" if the SEC publishes new ETF-related guidance or frameworks but no approval is granted.
`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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

const xrp4 = {
  collateral_token_id: 1,
  question: 'Will FXRP launch on the Flare mainnet by July 31, 2025?',
  outcomeResolutionDef: `"Yes" if FXRP is live and fully functional on the Flare mainnet for public minting and use by July 31, 2025.
"No" if FXRP is not available on Flare mainnet at all by that date.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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

const xrp5 = {
  collateral_token_id: 1,
  question: 'Will Flare release FAssets v2 with TEE integration by Q4 2025?',
  outcomeResolutionDef: `"Yes" if a version of FAssets v2 with working TEE integration is launched on Flare mainnet by December 31, 2025.
"No" if no version of FAssets v2 is launched by that date.
"Partial" if a version is launched, but TEE functionality is missing or only a subset of assets/features is supported.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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
      name: 'Partial',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/maybe.svg'
    }
  ]
};

const xrp6 = {
  collateral_token_id: 1,
  question: 'Will FXRP be bridged to another blockchain via LayerCake by Dec 31, 2025?',
  outcomeResolutionDef: `"Yes" if users can bridge FXRP to another blockchain and successfully transact with it by December 31, 2025.
"No" if no such bridging solution is operational or accessible by that date.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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

const xrp7 = {
  collateral_token_id: 1,
  question: 'Will Flare’s decentralized identity KYC solution be operational by Q1 2026?',
  outcomeResolutionDef: `"Fully Live" if the KYC system is publicly deployed and available to all users by March 31, 2026.
"Delayed" if no public-facing implementation is available by that date.`,
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
  predictionOutcomes: [
    {
      name: 'Fully Live',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'Delayed',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    }
  ]
};

const processPredictionSet = async () => {
  const context = await createContext();

  const selectedPredictionSet = xrp1;

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(selectedPredictionSet, context);
    ps.outcomes = selectedPredictionSet.predictionOutcomes.map((d) => new Outcome(d, context));

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
