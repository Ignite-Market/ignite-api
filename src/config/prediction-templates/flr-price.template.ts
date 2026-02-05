export const flrPriceTemplate = {
  id: 'flr-price',
  name: 'FLR Price Prediction',
  description: 'Predict if FLR price will be above/below a target price at a specific time',
  category: 'Finance',
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/flr.jpg',

  variables: {
    price: { type: 'number', label: 'Price Target (USD)', required: true },
    comparisonType: {
      type: 'select',
      label: 'Comparison Type',
      options: [
        { value: 'above', label: 'Above' },
        { value: 'below', label: 'Below' }
      ],
      default: 'above'
    },
    attestationTime: { type: 'datetime', label: 'Attestation Time', required: true }
  },

  questionTemplate: 'Will the FLR market price be {{comparisonType}} ${{priceFormatted}} on {{attestationTime}}?',

  outcomeResolutionTemplate:
    'This market will resolve to "Yes" if the price of FLR is {{comparisonType}} ${{priceFormatted}} on {{attestationTime}}. \nResolution sources: CoinGecko, CryptoCompare and Coinbase. \nThe market resolution is backed by Flare unique FDC Web2 connector.',

  dataSourceTemplates: [
    {
      endpoint: '{{apiProxyPrefix}}coingecko/api/v3/coins/flare/market_chart',
      httpMethod: 'GET',
      queryParams: {
        vs_currency: 'usd',
        days: '1'
      },
      jqQuery:
        '{ "outcomeIdx": [1, 0][((.prices | map(.[0] as $ts | [$ts, .[1], ($ts - {{attestationTimeUnixMs}} | fabs)]) | sort_by(.[2]) | .[0][1]) {{comparisonOp}} {{price}}) | if . then 0 else 1 end] }',
      abi: {
        components: [
          {
            internalType: 'uint256',
            name: 'outcomeIdx',
            type: 'uint256'
          }
        ],
        type: 'tuple'
      }
    },
    {
      endpoint: '{{apiProxyPrefix}}cryptocompare/data/v2/histominute',
      httpMethod: 'GET',
      queryParams: {
        fsym: 'FLR',
        tsym: 'USD',
        limit: '1',
        toTs: '{{attestationTimeUnix}}'
      },
      jqQuery: '{ "outcomeIdx": [1, 0][((.Data.Data[-1].close) {{comparisonOp}} {{price}}) | if . then 0 else 1 end] }',
      abi: {
        components: [
          {
            internalType: 'uint256',
            name: 'outcomeIdx',
            type: 'uint256'
          }
        ],
        type: 'tuple'
      }
    }
  ],

  defaults: {
    collateral_token_id: 1,
    consensusThreshold: 60,
    marketCapPercent: 30,
    outcomes: [
      { name: 'No', imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg' },
      { name: 'Yes', imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg' }
    ]
  }
};
