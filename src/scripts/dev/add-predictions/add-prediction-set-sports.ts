import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { DataSource } from '../../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const isDev = true;
const proxyBase = `https://api-proxy${isDev ? '-dev' : ''}.ignitemarket.xyz`;

const matchConfig = {
  sofascoreMatchId: 14442226,
  livescoreEid: 1620549,
  livescoreCategory: 'basketball',
  homeTeamName: 'Los Angeles Clippers',
  awayTeamName: 'Philadelphia 76ers'
};

const endTime = dayjs('2026-02-03T03:00:00Z').toDate();
const attestationTime = dayjs(endTime).add(2, 'hour');
const resolutionTime = dayjs(attestationTime).add(30, 'minute').toDate();
const matchDateFormatted = dayjs(endTime).utc().format('MMMM D, YYYY');

const data = {
  collateral_token_id: 1,
  question: `Will ${matchConfig.homeTeamName} win against ${matchConfig.awayTeamName} on ${matchDateFormatted}?`,
  outcomeResolutionDef: `This market resolves to "Yes" if ${matchConfig.homeTeamName} (home) wins on ${matchDateFormatted}. "No" if ${matchConfig.awayTeamName} (away) wins or the match is a tie. Resolution sources: Sofascore and LiveScore.`,
  startTime: new Date(Number(new Date())),
  endTime,
  attestationTime: attestationTime.toDate(),
  resolutionTime,
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  hide: true,
  marketCapPercent: 30,
  imgUrl: 'https://images.ignitemarket.xyz/upload/prediction-sets/nba.png',
  predictionOutcomes: [
    { name: 'Yes', imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg' },
    { name: 'No', imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg' }
  ]
};

// outcomeIdx 0 = Yes (home wins), 1 = No (away wins or tie). Non-completed (missing winnerCode/Ewt) → jq returns empty → attestation fails.
const outcomeIdxAbi = {
  components: [{ internalType: 'uint256', name: 'outcomeIdx', type: 'uint256' }],
  type: 'tuple'
};

const dataSources = [
  {
    endpoint: `${proxyBase}/sofascore/matches/detail`,
    httpMethod: 'GET',
    queryParams: { matchId: String(matchConfig.sofascoreMatchId) },
    jqQuery: '{ "outcomeIdx": (if .event.winnerCode == 1 then 0 elif (.event.winnerCode == 2 or .event.winnerCode == 3) then 1 else "" end) }',
    abi: outcomeIdxAbi
  },
  {
    endpoint: `${proxyBase}/livescore/matches/v2/get-scoreboard`,
    httpMethod: 'GET',
    queryParams: {
      Eid: String(matchConfig.livescoreEid),
      Category: matchConfig.livescoreCategory
    },
    jqQuery: '{ "outcomeIdx": (if .Ewt == 1 then 0 elif (.Ewt == 2 or .Ewt == 0) then 1 else "" end) }',
    abi: outcomeIdxAbi
  }
];

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(data, context);
    ps.outcomes = data.predictionOutcomes.map((d) => new Outcome(d, context));

    const dataSourceIds: number[] = [];
    if (data.resolutionType === ResolutionType.AUTOMATIC) {
      for (const dataSource of dataSources) {
        const ds = await new DataSource(dataSource, context).insert();
        dataSourceIds.push(ds.id);
      }
    }

    const predictionSet = await service.createPredictionSet(ps, dataSourceIds, context);
    await service.addPredictionCategory(predictionSet.id, 'Sports', context);

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
