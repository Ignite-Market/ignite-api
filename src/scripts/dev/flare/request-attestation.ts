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

// Market close time: 08:00:00 / 16:00:00 ChinaST
const attestationTime = dayjs('2025-07-01T08:00:00Z');
// const endTime = dayjs(attestationTime).subtract(1, 'day').toDate();
const endTime = dayjs('2025-07-01T09:30:00Z');
const attestationTimeUnix = dayjs(attestationTime).unix();
const attestationTimeFormatted = dayjs(attestationTime).utc().format('YYYY-MM-DD HH:mm:ss');
const goal = 24050;

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

const abi = {
  'components': [
    {
      'internalType': 'uint256',
      'name': 'outcomeIdx',
      'type': 'uint256'
    }
  ],
  'type': 'tuple'
};

(async () => {
  for (const dataSource of dataSources) {
    const endpoint = dataSource.endpoint;
    const httpMethod = dataSource.httpMethod;
    const queryParams = dataSource.queryParams;
    const jqQuery = dataSource.jqQuery;
    // const headers = dataSource?.headers;
    const headers = null;

    const test = await axios(endpoint, {
      method: httpMethod,
      headers: headers,
      params: queryParams
    });
    const data = test.data;
    console.log('API Response structure:');
    console.log(JSON.stringify(data, null, 2));

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
