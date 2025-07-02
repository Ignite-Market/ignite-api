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

const priceGoal = 2.01;

// const attestationTime = dayjs('2025-07-01T10:00:00Z');
const attestationTime = dayjs.utc().endOf('isoWeek');
const attestationTimeFormatted = dayjs(attestationTime).utc().format('MMM D, YYYY HH:mm');
const endTime = dayjs(attestationTime).toDate();
const resolutionTime = dayjs(attestationTime).add(1, 'hour').toDate();

const data = {
  collateral_token_id: 1,
  question: `Will the XRP market price be above $${priceGoal.toFixed(2)} at the end of this Sunday?`,
  outcomeResolutionDef: `This market will resolve to "Yes" if the price of XRP is above $${priceGoal.toFixed(2)} at the end of this Sunday (${attestationTimeFormatted}). The resolution sources will be CoinGecko, CryptoCompare and Coinbase.`,
  startTime: new Date(Number(new Date())),
  endTime,
  attestationTime: attestationTime.toDate(),
  resolutionTime,
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/xrp.jpg',
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
    endpoint: 'https://api.coingecko.com/api/v3/coins/ripple/history',
    httpMethod: 'GET',
    queryParams: {
      localization: 'false',
      date: attestationTime.format('DD-MM-YYYY')
    },
    jqQuery: `{ "outcomeIdx": [1, 0][(.market_data.current_price.usd >= ${priceGoal}) | if . then 0 else 1 end] }`,
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
    endpoint: 'https://min-api.cryptocompare.com/data/v2/histominute',
    httpMethod: 'GET',
    queryParams: {
      fsym: 'XRP',
      tsym: 'USD',
      limit: '1',
      toTs: attestationTime.unix()
    },
    jqQuery: `{ "outcomeIdx": [1, 0][(.Data.Data[-1].close >= ${priceGoal}) | if . then 0 else 1 end] }`,
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
    endpoint: 'https://api.coinbase.com/v2/prices/XRP-USD/spot',
    httpMethod: 'GET',
    queryParams: {
      date: attestationTime.format('YYYY-MM-DD')
    },
    jqQuery: `{ "outcomeIdx": [1, 0][(.data.amount >= ${priceGoal}) | if . then 0 else 1 end] }`,
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
    await service.addPredictionCategory(predictionSet.id, 'XRP', context);

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
