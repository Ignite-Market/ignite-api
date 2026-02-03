export const sportsMatchTemplate = {
  id: 'sports-match',
  name: 'Sports Match Prediction',
  description: 'Predict if the home team will win against the away team (Yes/No). Ties resolve to No.',
  category: 'Sports',
  imgUrl: null,

  variables: {
    homeTeamName: { type: 'string', label: 'Home Team Name', required: true },
    awayTeamName: { type: 'string', label: 'Away Team Name', required: true },
    attestationTime: { type: 'datetime', label: 'Match Date / Attestation Time', required: true },
    sofascoreMatchId: { type: 'number', label: 'Sofascore Match ID', required: true },
    livescoreEid: { type: 'number', label: 'LiveScore Event ID (Eid)', required: true },
    livescoreCategory: {
      type: 'string',
      label: 'Sport Category',
      default: 'basketball',
      options: [
        { value: 'soccer', label: 'Soccer' },
        { value: 'basketball', label: 'Basketball' },
        { value: 'cricket', label: 'Cricket' },
        { value: 'tennis', label: 'Tennis' },
        { value: 'hockey', label: 'Hockey' }
      ]
    }
  },

  questionTemplate: 'Will {{homeTeamName}} win against {{awayTeamName}} on {{matchDateFormatted}}?',

  outcomeResolutionTemplate:
    'This market resolves to "Yes" if {{homeTeamName}} (home) wins on {{matchDateFormatted}}. "No" if {{awayTeamName}} (away) wins or the match is a tie. Non-completed matches cause resolution to fail. Resolution sources: Sofascore and LiveScore (RapidAPI).',

  dataSourceTemplates: [
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
    },
    {
      endpoint: '{{apiProxyPrefix}}livescore/matches/v2/get-scoreboard',
      httpMethod: 'GET',
      queryParams: {
        Eid: '{{livescoreEid}}',
        Category: '{{livescoreCategory}}'
      },
      jqQuery: '{ "outcomeIdx": (if .Ewt == 1 then 0 elif (.Ewt == 2 or .Ewt == 0) then 1 else "" end) }',
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
