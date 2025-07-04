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

const us1 = {
  collateral_token_id: 1,
  question: "Will the annualized US GDP growth rate for Q2 2025 be at or above 2.0% according to the BEA's advance estimate?",
  outcomeResolutionDef:
    "This market will resolve to 'Yes' if the Bureau of Economic Analysis (https://www.bea.gov) reports a Q2 2025 GDP annualized growth rate of 2.0% or higher in its advance estimate released on July 30, 2025. Otherwise, it resolves to 'No'.",
  startTime: new Date(),
  endTime: dayjs('2025-07-29T23:59:59Z').toDate(),
  resolutionTime: dayjs('2025-08-31T12:00:00Z').toDate(),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/us.png',
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
  categories: ['Finance']
};

const us2 = {
  collateral_token_id: 1,
  question: 'Will the US Federal Funds target rate be 5.25% or higher at the end of July 2025?',
  outcomeResolutionDef:
    "This market will resolve to 'Yes' if the target upper bound of the federal funds rate is 5.25% or higher as of July 31, 2025, according to https://www.federalreserve.gov. Otherwise, it resolves to 'No'.",
  startTime: new Date(),
  endTime: dayjs('2025-07-31T23:59:59Z').toDate(),
  resolutionTime: dayjs('2025-08-01T12:00:00Z').toDate(),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/us.png',
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
  categories: ['Finance']
};

const us3 = {
  collateral_token_id: 1,
  question: 'Will the US CPI year-over-year inflation rate for July 2025 be at or above 3.0%?',
  outcomeResolutionDef:
    "This market will resolve to 'Yes' if the BLS (https://www.bls.gov) reports a year-over-year CPI inflation rate of 3.0% or higher for July 2025 in the CPI report released in August. Otherwise, it resolves to 'No'.",
  startTime: new Date(),
  endTime: dayjs('2025-07-31T23:59:59Z').toDate(),
  resolutionTime: dayjs('2025-08-01T12:00:00Z').toDate(),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/us.png',
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
  categories: ['Finance']
};

const us4 = {
  collateral_token_id: 1,
  question: 'Will the US unemployment rate for July 2025 be 4.0% or higher?',
  outcomeResolutionDef:
    "This market will resolve to 'Yes' if the U.S. Bureau of Labor Statistics (https://www.bls.gov) reports an unemployment rate of 4.0% or higher for July 2025 in the monthly Employment Situation report released in early August. Otherwise, it resolves to 'No'.",
  startTime: new Date(),
  endTime: dayjs('2025-07-31T23:59:59Z').toDate(),
  resolutionTime: dayjs('2025-08-02T12:00:00Z').toDate(),
  resolutionType: ResolutionType.MANUAL,
  consensusThreshold: 60,
  imgUrl: 'https://images.ignitemarket.xyz/prediction-sets/us.png',
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
  categories: ['Finance']
};

const processPredictionSet = async () => {
  const context = await createContext();

  const selectedPredictionSet = us4;

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
