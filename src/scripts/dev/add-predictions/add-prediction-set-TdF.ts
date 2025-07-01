import { addPredictionSet } from '../../../lib/blockchain';
import { createContext } from '../../../lib/utils';
import { Outcome } from '../../../modules/prediction-set/models/outcome.model';
import { PredictionSet, ResolutionType } from '../../../modules/prediction-set/models/prediction-set.model';
import { PredictionSetService } from '../../../modules/prediction-set/prediction-set.service';

const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const tdf1 = {
  question: 'Will Tadej Pogačar be in the top 3 overall by the end of Week 1 (Stage 7)?',
  outcomeResolutionDef: "This resolves to 'Yes' if Pogačar is officially ranked 1st‑3rd in GC at the end of Stage 7.",
  startTime: new Date(Number(new Date()) + twoHours),
  endTime: new Date(Number(new Date()) + oneWeek),
  resolutionTime: new Date(Number(new Date()) + oneWeek + twoHours),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  predictionOutcomes: [
    {
      name: 'Yes',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/yes.svg'
    },
    {
      name: 'No',
      imgUrl: 'https://images.ignitemarket.xyz/outcomes/no.svg'
    }
  ]
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
