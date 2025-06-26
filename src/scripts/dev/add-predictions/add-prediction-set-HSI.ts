import { env } from '../../../config/env';
import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { DataSource } from '../../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';
import * as dayjs from 'dayjs';

// Market close time: 08:00:00 / 16:00:00 CST
const attestationTime = dayjs('2025-06-30T16:00:00Z');
const endTime = dayjs(attestationTime).subtract(1, 'day').toDate();
const resolutionTime = dayjs(attestationTime).add(1, 'hour').toDate();
const attestationTimeUnix = dayjs(attestationTime).unix();
const goal = 24000;

const data = {
  collateral_token_id: 1,
  question: `Will the Hang Seng Index be above 24,000 at at market close on June 30?`,
  outcomeResolutionDef: `
    This market will resolve to 'Yes' if the official closing value of the Hang Seng Index on June 30, 2025, as reported by a reliable financial source (e.g., https://www.investing.com/indices/hang-sen-40 or https://www.bloomberg.com), is strictly greater than 24,000. Otherwise, it will resolve to 'No'.
  `,
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
  ]
};

const dataSources = [
  {
    endpoint: 'https://bb-finance.p.rapidapi.com/market/get-chart',
    httpMethod: 'GET',
    queryParams: {
      id: 'HSI:ind',
      interval: 'd1'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.result."HSI:IND".ticks[] | select(.time == ${attestationTimeUnix}) | .close) // .result."HSI:IND".ticks[-1].close) >= ${goal} | if . then 0 else 1 end], "source": "primary" }`,
    abi: {
      'components': [
        {
          'internalType': 'uint256',
          'name': 'outcomeIdx',
          'type': 'uint256'
        },
        {
          'internalType': 'string',
          'name': 'source',
          'type': 'string'
        }
      ],
      'type': 'tuple'
    },
    headers: {
      'x-rapidapi-host': 'bb-finance.p.rapidapi.com',
      'x-rapidapi-key': env.RAPID_API_KEY
    }
  }
  // {
  //   endpoint: 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes',
  //   httpMethod: 'GET',
  //   queryParams: {
  //     ticker: '^HSI'
  //   },
  //   jqQuery: `{ "outcomeIdx": [1, 0][(.body[0].regularMarketPrice >= ${goal}) | if . then 0 else 1 end] }`,
  //   abi: {
  //     'components': [
  //       {
  //         'internalType': 'uint256',
  //         'name': 'outcomeIdx',
  //         'type': 'uint256'
  //       }
  //     ],
  //     'type': 'tuple'
  //   },
  //   headers: {
  //     'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
  //     'x-rapidapi-key': env.RAPID_API_KEY
  //   }
  // },
  // {
  //   endpoint: 'https://seeking-alpha.p.rapidapi.com/symbols/get-chart',
  //   httpMethod: 'GET',
  //   queryParams: {
  //     symbol: 'HSI',
  //     period: '1D'
  //   },
  //   jqQuery: `{ "outcomeIdx": [1, 0][(.result."HSI:IND".ticks[-1].close >= ${goal}) | if . then 0 else 1 end] }`,
  //   abi: {
  //     'components': [
  //       {
  //         'internalType': 'uint256',
  //         'name': 'outcomeIdx',
  //         'type': 'uint256'
  //       }
  //     ],
  //     'type': 'tuple'
  //   },
  //   headers: {
  //     'x-rapidapi-host': 'seeking-alpha.p.rapidapi.com',
  //     'x-rapidapi-key': env.RAPID_API_KEY
  //   }
  // }
];

// Add two more identical data sources with different source identifiers
const dataSource2 = {
  ...dataSources[0],
  jqQuery: `{ "outcomeIdx": [1, 0][((.result."HSI:IND".ticks[] | select(.time == ${attestationTimeUnix}) | .close) // .result."HSI:IND".ticks[-1].close) >= ${goal} | if . then 0 else 1 end], "source": "secondary" }`
};

const dataSource3 = {
  ...dataSources[0],
  jqQuery: `{ "outcomeIdx": [1, 0][((.result."HSI:IND".ticks[] | select(.time == ${attestationTimeUnix}) | .close) // .result."HSI:IND".ticks[-1].close) >= ${goal} | if . then 0 else 1 end], "source": "tertiary" }`
};

dataSources.push(dataSource2, dataSource3);

// TODO: Add more data sources. Since attestation request is limited to 1s, other data sources can not be used, since they take more than 1s to respond.

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
