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
// Market close time: 20:00:00 UTC / 16:00:00 EDT
const attestationTime = dayjs('2025-07-07T20:00:00Z');
const endTime = dayjs(attestationTime).subtract(1, 'hour').toDate();
// const endTime = dayjs('2025-07-07T10:00:00Z');
const resolutionTime = dayjs(endTime).add(1, 'hour').toDate();
const attestationTimeUnix = dayjs(attestationTime).unix();

// attestation time in exchange local time - US EDT
const attestationTimeFormatted = dayjs(attestationTime).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss');

const goal = 6100;
const goalFormatted = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
}).format(goal);

const data = {
  collateral_token_id: 1,
  question: `Will the S&P 500 index be above ${goalFormatted} at market close on ${attestationTime.utc().format('MMMM D')}?`,
  outcomeResolutionDef: `This market will resolve to 'Yes' if the official closing value of the S&P 500 index on ${attestationTime.utc().format('MMMM DD, YYYY')}, as reported by a reliable financial source (e.g., https://www.investing.com/indices/us-spx-500 or https://www.bloomberg.com), is strictly greater than ${goalFormatted}. Otherwise, it will resolve to 'No'.`,
  startTime: new Date(Number(new Date())),
  endTime,
  attestationTime: attestationTime.toDate(),
  resolutionTime,
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/nyse.png',
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
      id: 'SPX:ind',
      interval: 'd1'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.result."SPX:IND".ticks[] | select(.time == ${attestationTimeUnix}) | .close) // .result."SPX:IND".ticks[-1].close) >= ${goal} | if . then 0 else 1 end] }`,
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
      ticker: '^GSPC',
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
      symbol: '.INX:INDEXSP',
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
