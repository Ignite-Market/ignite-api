import { ProposalRound, ProposalRoundStatus } from '../../modules/prediction-set-proposal/models/proposal-round.model';
import { createContext } from './context';

const tenMinutes = 10 * 60 * 1000;
const fifteenMinutes = 10 * 60 * 1000;
const twoHours = 2 * 60 * 60 * 1000;
const fourHours = 4 * 60 * 60 * 1000;
const sixHours = 6 * 60 * 60 * 1000;
const oneWeek = 7 * 24 * 60 * 60 * 1000;

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    const proposalRound = new ProposalRound(
      {
        rewardPoints: 100,
        startTime: new Date(),
        endTime: new Date(Number(new Date()) + oneWeek),
        roundStatus: ProposalRoundStatus.ACTIVE
      },
      context
    );

    await proposalRound.insert();
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
