export const hsiIndexTemplate = {
  id: 'hsi-index',
  name: 'Hang Seng Index Prediction',
  description: 'Predict if the Hang Seng Index will be above a target value at market close',
  category: 'Finance',
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/hsi.png',

  variables: {
    goal: { type: 'number', label: 'Index Target', required: true },
    attestationTime: { type: 'datetime', label: 'Market Close Time (UTC)', required: true }
  },

  questionTemplate: 'Will the Hang Seng Index be above {{goal}} at market close on {{attestationTime}}?',

  outcomeResolutionTemplate:
    "This market will resolve to 'Yes' if the official closing value of the Hang Seng Index on {{attestationTime}}, as reported by a reliable financial source, is strictly greater than {{goal}}. Otherwise, it will resolve to 'No'. The resolution sources will be: Bloomberg, Yahoo finance and Google finance.",

  dataSourceTemplates: [
    {
      endpoint: '{{apiProxyPrefix}}bloomberg/market/get-chart',
      httpMethod: 'GET',
      queryParams: {
        id: 'HSI:ind',
        interval: 'd1'
      },
      jqQuery:
        '{ "outcomeIdx": [1, 0][((.result."HSI:IND".ticks[] | select(.time == {{attestationTimeUnix}}) | .close) // .result."HSI:IND".ticks[-1].close) >= {{goal}} | if . then 0 else 1 end] }',
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
      endpoint: '{{apiProxyPrefix}}yahoo/api/v1/markets/stock/history',
      httpMethod: 'GET',
      queryParams: {
        ticker: '^HSI',
        interval: '30m'
      },
      jqQuery:
        '{ "outcomeIdx": [1, 0][((.body | to_entries[] | select(.value.date_utc == {{attestationTimeUnix}}) | .value.close) // (.body | to_entries | last | .value.close)) >= {{goal}} | if . then 0 else 1 end] }',
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
      endpoint: '{{apiProxyPrefix}}real-time/stock-time-series',
      httpMethod: 'GET',
      queryParams: {
        symbol: 'HSI:INDEXHANGSENG',
        period: '5D',
        language: 'en'
      },
      jqQuery:
        '{ "outcomeIdx": [1, 0][((.data.time_series | to_entries[] | select(.key == "{{attestationTimeFormatted}}") | .value.price) // (.data.time_series | to_entries | last | .value.price)) >= {{goal}} | if . then 0 else 1 end] }',
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
