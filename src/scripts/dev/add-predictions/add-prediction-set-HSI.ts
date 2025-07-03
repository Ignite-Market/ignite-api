import { env } from '../../../config/env';
import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { DataSource } from '../../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

// Market close time: 08:00:00 UTC / 16:00:00 ChinaST
const attestationTime = dayjs('2025-07-07T08:00:00Z');
const endTime = dayjs(attestationTime).subtract(1, 'hour').toDate();
const resolutionTime = dayjs(attestationTime).add(1, 'hour').toDate();
const attestationTimeUnix = dayjs(attestationTime).unix();
// attestation time in exchange local time - China ST
const attestationTimeFormatted = dayjs(attestationTime).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss');

const goal = 24000;
const goalFormatted = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
}).format(goal);

const data = {
  collateral_token_id: 1,
  question: `Will the Hang Seng Index be above ${goalFormatted} at at market close on ${attestationTime.utc().format('MMMM D')}?`,
  outcomeResolutionDef: `This market will resolve to 'Yes' if the official closing value of the Hang Seng Index on ${attestationTime.utc().format('MMMM DD, YYYY')}, as reported by a reliable financial source, is strictly greater than ${goalFormatted}. Otherwise, it will resolve to 'No'. 
  The resolution sources will be: Bloomberg, Yahoo finance and Google finance.`,
  startTime: new Date(Number(new Date())),
  endTime,
  attestationTime: attestationTime.toDate(),
  resolutionTime,
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/hsi.png',
  predictionOutcomes: [
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    },
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    }
  ],
  categories: ['Finance']
};

const dataSources = [
  {
    endpoint: 'https://api-proxy.ignitemarket.xyz/bloomberg/market/get-chart',
    httpMethod: 'GET',
    queryParams: {
      id: 'HSI:ind',
      interval: 'd1'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.result."HSI:IND".ticks[] | select(.time == ${attestationTimeUnix}) | .close) // .result."HSI:IND".ticks[-1].close) >= ${goal} | if . then 0 else 1 end] }`,
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
    endpoint: 'https://api-proxy.ignitemarket.xyz/yahoo/api/v1/markets/stock/history',
    httpMethod: 'GET',
    queryParams: {
      ticker: '^HSI',
      interval: '30m'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.body | to_entries[] | select(.value.date_utc == ${attestationTimeUnix}) | .value.close) // (.body | to_entries | last | .value.close)) >= ${goal} | if . then 0 else 1 end] }`,
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
    endpoint: 'https://api-proxy.ignitemarket.xyz/real-time/stock-time-series',
    httpMethod: 'GET',
    queryParams: {
      symbol: 'HSI:INDEXHANGSENG',
      period: '5D',
      language: 'en'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.data.time_series | to_entries[] | select(.key == "${attestationTimeFormatted}") | .value.price) // (.data.time_series | to_entries | last | .value.price)) >= ${goal} | if . then 0 else 1 end] }`,
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

    if (data.categories) {
      for (const category of data.categories) {
        await service.addPredictionCategory(predictionSet.id, category, context);
      }
    }

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
