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

const endTime = dayjs('2025-07-19T10:00:00Z').toDate();
const resolutionTime = dayjs('2025-07-21T09:00:00Z').toDate();

const tdf1 = {
  collateral_token_id: 1,
  question: 'Will Tadej Pogačar be in the top 3 overall by the end of Week 2 (Stage 14)?',
  outcomeResolutionDef:
    "This resolves to 'Yes' if Pogačar is officially ranked 1st-3rd in GC at the end of Stage 14. Using official GC standings after Stage 14 from the Tour de France Race Center.",
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

const tdf2 = {
  collateral_token_id: 1,
  question: 'Will a French rider win any stage during Week 2 (Stages 8-14)?',
  outcomeResolutionDef:
    "This resolves to 'Yes' if atleast one rider with French nationality wins any stage during Week 2 (Stages 8-14). Using official stage results from the Tour de France Race Center.",
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

const tdf3 = {
  collateral_token_id: 1,
  question: 'Will Primož Roglič be among the first 4 riders in the general classification at the end of the Tour?',
  outcomeResolutionDef:
    "This resolves to 'Yes' if Roglič is officially ranked 1st-4th in GC at the end of the Tour. Using official GC standings after the Tour from the Tour de France Race Center.",
  startTime: new Date(Number(new Date())),
  endTime: dayjs('2025-07-27T10:00:00Z').toDate(),
  resolutionTime: dayjs('2025-07-28T08:00:00Z').toDate(),
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

const tdf4 = {
  collateral_token_id: 1,
  question: 'Will Jasper Philipsen get more then one stage win at the end of the Tour?',
  outcomeResolutionDef:
    "This resolves to 'Yes' if Philipsen wins more than one stage at the end of the Tour. Using official stage results after the Tour from the Tour de France Race Center.",
  startTime: new Date(Number(new Date())),
  endTime: dayjs('2025-07-27T10:00:00Z').toDate(),
  resolutionTime: dayjs('2025-07-28T08:00:00Z').toDate(),
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

  const selectedPredictionSet = tdf4;

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
