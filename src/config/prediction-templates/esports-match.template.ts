export const esportsMatchTemplate = {
  id: 'esports-match',
  name: 'Esports Match Prediction',
  description: 'Predict if the home team will win against the away team (Yes/No). Ties resolve to No.',
  category: 'Sports',
  imgUrl: null,

  variables: {
    pandascoreMatchId: { type: 'pandascore-match', label: 'Pandascore Match', required: true, precision: 0 },
    homeTeamName: { type: 'string', label: 'Home Team Name', required: true },
    awayTeamName: { type: 'string', label: 'Away Team Name', required: true },
    attestationTime: { type: 'datetime', label: 'Match Date', required: true },
    sofascoreMatchId: {
      type: 'number',
      label: 'Sofascore Match ID',
      link: 'https://www.sofascore.com/esports',
      required: true,
      precision: 0
    }
  },

  questionTemplate: 'Will {{homeTeamName}} win against {{awayTeamName}} on {{matchDateFormatted}}?',

  outcomeResolutionTemplate:
    'This market resolves to "Yes" if {{homeTeamName}} (home) wins on {{matchDateFormatted}}. "No" if {{awayTeamName}} (away) wins or the match is a tie, or the match is canceled or postponed. \nResolution sources: Pandascore and Sofascore. \nThe market resolution is backed by Flare unique FDC Web2 connector.',

  dataSourceTemplates: [
    {
      endpoint: '{{apiProxyPrefix}}pandascore/matches/{{pandascoreMatchId}}',
      httpMethod: 'GET',
      jqQuery: '{ "outcomeIdx": (if .status == "finished" then (if .winner_id == .opponents[0].opponent.id then 0 else 1 end) else "" end) }',
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
      endpoint: '{{apiProxyPrefix}}sofascore/matches/detail',
      httpMethod: 'GET',
      queryParams: {
        matchId: '{{sofascoreMatchId}}'
      },
      jqQuery: '{ "outcomeIdx": (if .event.winnerCode == 1 then 0 elif (.event.winnerCode == 2 or .event.winnerCode == 3) then 1 else "" end) }',
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
      { name: 'Yes', imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg' },
      { name: 'No', imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg' }
    ]
  }
};
