import { env } from '../../config/env';
import { addPredictionSet } from '../../lib/blockchain';
import { DataSource } from '../../modules/prediction-set/models/data-source.model';
import { Outcome } from '../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../modules/prediction-set/prediction-set.service';
import { createContext } from './context';

const tenMinutes = 10 * 60 * 1000;
const fifteenMinutes = 10 * 60 * 1000;
const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const data = {
  question: 'NBA: Lakers vs. Rockets',
  description: 'Who will win the game between the Lakers and Rockets?',
  generalResolutionDef: 'This market will resolve to the winning team based on the final score at the end of the game.',
  outcomeResolutionDef:
    "This market will resolve based on the official final score of the game as reported by the NBA. If the Lakers have a higher score, the market resolves to 'Lakers'. If the Rockets have a higher score, the market resolves to 'Rockets'. If the game ends in a tie and goes to overtime, the final score after overtime will determine the resolution. The official resolution source will be NBA.com or ESPN.",
  outcomePriceDef: 'The full outcome price always resolves to 100%.',
  startTime: new Date(Number(new Date())),
  endTime: new Date(Number(new Date()) + fifteenMinutes),
  resolutionTime: new Date(Number(new Date()) + fifteenMinutes * 2),
  resolutionType: ResolutionType.AUTOMATIC,
  consensusThreshold: 60,
  tags: 'github',
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/nba.png',
  predictionOutcomes: [
    {
      name: 'Lakers',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/lakers.svg'
    },
    {
      name: 'Rockets',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/rockets.svg'
    }
  ]
};

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(data, context);
    ps.outcomes = data.predictionOutcomes.map((d) => new Outcome(d, context));

    const dataSourceIds = [];
    if (data.resolutionType === ResolutionType.AUTOMATIC) {
      // Add data sources.

      const id = Number(new Date());
      for (let i = 1; i <= 3; i++) {
        const ds = await new DataSource(
          {
            endpoint: `${env.MOCK_RESULTS_API_ENDPOINT}/?apiId=${id + i}`,
            jqQuery: '.result',
            abi: {
              'type': 'uint256'
            }
          },
          context
        ).insert();

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
