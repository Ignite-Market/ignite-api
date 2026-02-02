import { env } from '../../../config/env';
import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { DataSource } from '../../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(utc);

const isDev = false;
const comparisonType: 'above' | 'below' = 'below';
const priceGoal = 90000;

const attestationTime = dayjs('2026-01-26T14:30:00Z');
// const attestationTime = dayjs.utc().endOf('isoWeek');
const attestationTimeFormatted = dayjs(attestationTime).utc().format('MMM D, YYYY HH:mm');
const endTime = dayjs(attestationTime).toDate();
const resolutionTime = dayjs(attestationTime).add(0.5, 'hour').toDate();

// Helper function to generate comparison operator based on comparison type
const getComparisonOperator = (type: 'above' | 'below'): string => {
  return type === 'above' ? '>=' : '<';
};

// Helper function to get comparison text
const getComparisonText = (type: 'above' | 'below'): string => {
  return type;
};

const comparisonOp = getComparisonOperator(comparisonType);
const comparisonText = getComparisonText(comparisonType);

const data = {
  collateral_token_id: 1,
  question: `Will the BTC market price be ${comparisonText} $${priceGoal.toLocaleString()} on ${attestationTimeFormatted}?`,
  outcomeResolutionDef: `This market will resolve to "Yes" if the price of BTC is ${comparisonText} $${priceGoal.toLocaleString()} on ${attestationTimeFormatted}.
  The resolution sources will be: CoinGecko, CryptoCompare and Coinbase.`,
  startTime: new Date(Number(new Date())),
  endTime,
  attestationTime: attestationTime.toDate(),
  resolutionTime,
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  hide: true,
  marketCapPercent: 30,
  imgUrl: 'https://images.ignitemarket.xyz/upload/prediction-sets/bitcoin.webp',
  predictionOutcomes: [
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    },
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    }
  ]
};

const dataSources = [
  {
    endpoint: `https://api-proxy${isDev ? '-dev' : ''}.ignitemarket.xyz/coingecko/api/v3/coins/bitcoin/market_chart`,
    httpMethod: 'GET',
    queryParams: {
      vs_currency: 'usd',
      days: '1'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.prices | map(select(.[0] >= ${attestationTime.unix() * 1000})) | sort_by(.[0]) | .[0][1]) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
    // headers: { 'x-api-key': env.PROXY_API_KEY },
    abi: {
      'components': [
        {
          'internalType': 'uint256',
          'name': 'outcomeIdx',
          'type': 'uint256'
        }
      ],
      'type': 'tuple'
    }
  },
  {
    endpoint: `https://api-proxy${isDev ? '-dev' : ''}.ignitemarket.xyz/cryptocompare/data/v2/histominute`,
    httpMethod: 'GET',
    queryParams: {
      fsym: 'BTC',
      tsym: 'USD',
      limit: '1',
      toTs: attestationTime.unix()
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.Data.Data[-1].close) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
    // headers: { 'x-api-key': env.PROXY_API_KEY },
    abi: {
      'components': [
        {
          'internalType': 'uint256',
          'name': 'outcomeIdx',
          'type': 'uint256'
        }
      ],
      'type': 'tuple'
    }
  },
  {
    endpoint: `https://api-proxy${isDev ? '-dev' : ''}.ignitemarket.xyz/cryptocompare/data/v2/histominute`,
    httpMethod: 'GET',
    queryParams: {
      fsym: 'BTC',
      tsym: 'USD',
      limit: '1',
      toTs: attestationTime.unix()
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.Data.Data[-1].close | .) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
    // headers: { 'x-api-key': env.PROXY_API_KEY },
    abi: {
      'components': [
        {
          'internalType': 'uint256',
          'name': 'outcomeIdx',
          'type': 'uint256'
        }
      ],
      'type': 'tuple'
    }
  }
  // {
  //   endpoint: `https://api-proxy${isDev ? '-dev' : ''}.ignitemarket.xyz/coinbase/v2/prices/BTC-USD/spot`,
  //   httpMethod: 'GET',
  //   queryParams: {
  //     date: attestationTime.utc().format('YYYY-MM-DD')
  //   },
  //   jqQuery: `{ "outcomeIdx": [1, 0][((.data.amount | tonumber) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
  //   headers: { 'x-api-key': env.PROXY_API_KEY},
  //   abi: {
  //     'components': [
  //       {
  //         'internalType': 'uint256',
  //         'name': 'outcomeIdx',
  //         'type': 'uint256'
  //       }
  //     ],
  //     'type': 'tuple'
  //   }
  // }
];

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(data, context);
    ps.outcomes = data.predictionOutcomes.map((d) => new Outcome(d, context));

    const dataSourceIds = [];
    if (data.resolutionType === ResolutionType.AUTOMATIC) {
      // Add data sources.
      for (const dataSource of dataSources) {
        const ds = await new DataSource(dataSource, context).insert();
        dataSourceIds.push(ds.id);
      }
    }

    // Create prediction set.
    const predictionSet = await service.createPredictionSet(ps, dataSourceIds, context);
    await service.addPredictionCategory(predictionSet.id, 'Finance', context);

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
