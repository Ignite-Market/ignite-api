import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const endTime = dayjs('2025-07-11T11:00:00Z').toDate();
const resolutionTime = dayjs('2025-07-14T09:00:00Z').toDate();

const tdf1 = {
  collateral_token_id: 1,
  question: 'Will Tadej Pogačar be in the top 3 overall by the end of Week 1 (Stage 7)?',
  outcomeResolutionDef:
    "This resolves to 'Yes' if Pogačar is officially ranked 1st‑3rd in GC at the end of Stage 7. Using official GC standings after Stage 7 from the Tour de France Race Center",
  startTime: new Date(Number(new Date())),
  endTime,
  resolutionTime,
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/tdf.png',
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    }
  ],
  categories: ['Sports']
};

const processPredictionSet = async () => {
  const context = await createContext();

  const selectedPredictionSet = tdf1;

  try {
    const service = new PredictionSetService();

    const ps = new PredictionSet(selectedPredictionSet, context);
    ps.outcomes = selectedPredictionSet.predictionOutcomes.map((d) => new Outcome(d, context));

    // Create prediction set.
    const predictionSet = await service.createPredictionSet(ps, [], context);

    if (selectedPredictionSet.categories) {
      for (const category of selectedPredictionSet.categories) {
        await service.addPredictionCategory(predictionSet.id, category, context);
      }
    }

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
