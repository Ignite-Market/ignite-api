import { env, exit } from 'process';
import { prepareAttestationRequest } from '../../../lib/flare/attestation';
import axios from 'axios';
import * as jq from 'node-jq';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

// const endpoint = 'https://swapi.info/api/people/3';
// const jqQuery = `{name: .name, height: .height, mass: .mass, numberOfFilms: .films | length, uid: (.url | split("/") | .[-1] | tonumber)}`;
// const abi = `{"components": [{"internalType": "string", "name": "name", "type": "string"},{"internalType": "uint256", "name": "height", "type": "uint256"},{"internalType": "uint256", "name": "mass", "type": "uint256"},{"internalType": "uint256", "name": "numberOfFilms", "type": "uint256"},{"internalType": "uint256", "name": "uid", "type": "uint256"}],"name": "task","type": "tuple"}`;
// const endpoint = 'https://mock-api.ignitemarket.xyz/api1';

const comparedPrice = 24000; // Variable for the price threshold

// const endpoint = 'https://bb-finance.p.rapidapi.com/market/get-chart';
// const jqQuery = `{ "outcomeIdx": [1, 0][(.result."HSI:IND".ticks[-1].close >= ${comparedPrice}) | if . then 0 else 1 end] }`;
// const queryParams = {
//   id: 'HSI:ind',
//   interval: 'd1'
// };
// const headers = {
//   'x-rapidapi-host': 'bb-finance.p.rapidapi.com',
//   'x-rapidapi-key': env.RAPID_API_KEY
// };

// const endpoint = 'https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/quotes';
// const jqQuery = `{ "outcomeIdx": [1, 0][(.body[0].regularMarketPrice >= ${comparedPrice}) | if . then 0 else 1 end] }`;
// const queryParams = {
//   ticker: '^HSI'
// };
// const headers = {
//   'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
//   'x-rapidapi-key': env.RAPID_API_KEY
// };

// const endpoint = 'https://seeking-alpha.p.rapidapi.com/symbols/get-chart';
// const jqQuery = `{ "outcomeIdx": [1, 0][(.attributes | to_entries | sort_by(.key) | last | .value.close >= ${comparedPrice}) | if . then 0 else 1 end] }`;
// const queryParams = {
//   symbol: 'HSI',
//   period: '1D'
// };
// const headers = {
//   'x-rapidapi-host': 'seeking-alpha.p.rapidapi.com',
//   'x-rapidapi-key': env.RAPID_API_KEY
// };

// BTC Prediction configuration
// Set comparisonType to 'above' or 'below' to test different scenarios
const comparisonType: 'above' | 'below' = 'below'; // Change to 'above' for above comparison
const attestationTime = dayjs('2026-01-26T13:00:00Z');
const attestationTimeUnix = dayjs(attestationTime).unix();
const attestationTimeFormatted = dayjs(attestationTime).utc().format('YYYY-MM-DD HH:mm:ss');
const priceGoal = 100000;

// Helper function to generate comparison operator based on comparison type
const getComparisonOperator = (type: 'above' | 'below'): string => {
  return type === 'above' ? '>=' : '<';
};

// Generate jq queries dynamically based on comparison type
const comparisonOp = getComparisonOperator(comparisonType);
const dataSources = [
  {
    endpoint: 'https://api-proxy-dev.ignitemarket.xyz/coingecko/api/v3/coins/bitcoin/market_chart',
    httpMethod: 'GET',
    queryParams: {
      vs_currency: 'usd',
      days: '1'
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.prices | map(select(.[0] >= ${attestationTime.unix() * 1000})) | sort_by(.[0]) | .[0][1]) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
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
    endpoint: 'https://api-proxy-dev.ignitemarket.xyz/cryptocompare/data/v2/histominute',
    httpMethod: 'GET',
    queryParams: {
      fsym: 'BTC',
      tsym: 'USD',
      limit: '1',
      toTs: attestationTime.unix()
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.Data.Data[-1].close) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
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
    endpoint: 'https://api-proxy-dev.ignitemarket.xyz/cryptocompare/data/v2/histominute',
    httpMethod: 'GET',
    queryParams: {
      fsym: 'BTC',
      tsym: 'USD',
      limit: '1',
      toTs: attestationTime.unix()
    },
    jqQuery: `{ "outcomeIdx": [1, 0][((.Data.Data[-1].close | .) ${comparisonOp} ${priceGoal}) | if . then 0 else 1 end] }`,
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

(async () => {
  console.log(`\n=== Testing BTC Prediction: ${comparisonType.toUpperCase()} $${priceGoal.toLocaleString()} ===`);
  console.log(`Attestation Time: ${attestationTimeFormatted} UTC\n`);

  for (const dataSource of dataSources) {
    const endpoint = dataSource.endpoint;
    const httpMethod = dataSource.httpMethod;
    const queryParams = dataSource.queryParams;
    const jqQuery = dataSource.jqQuery;
    const headers = null;
    const abi = dataSource?.abi;

    const proxyHeaders = {
      'x-api-key': 'zeqjv3IoLeN0ZYdiIr5sFm01CvHRt4TBvSJG3T9Y2Mk'
    };

    const test = await axios(endpoint, {
      method: httpMethod,
      headers: proxyHeaders,
      params: queryParams
    });
    const data = test.data;
    console.log('API Request:');
    console.log(endpoint, httpMethod, queryParams);
    // console.log('API Response structure:');
    // console.log(JSON.stringify(data, null, 2));

    // Test the jq query with real jq
    console.log('\nTesting JQ Query:');
    try {
      const jqResult = await jq.run(jqQuery, data, { input: 'json' });
      console.log('JQ Query result:', jqResult);
    } catch (error) {
      console.error('JQ Query failed:', error);
    }

    const attestationRequest = await prepareAttestationRequest(endpoint, jqQuery, abi, httpMethod, null, headers, queryParams);
    console.log('\nAttestation Request:');
    console.log(JSON.stringify(attestationRequest, null, 2));
  }

  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
