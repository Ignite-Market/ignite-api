import { createContext } from '../../lib/utils';
import { Proposal } from '../../modules/proposal/models/proposal.model';

const data = {
  round_id: 2,
  user_id: 1,
  question: 'Bitcoin all time high by March 31?',
  generalResolutionDef: ` Solana has been working on improving its transaction throughput, and they claim they can handle
                          high TPS. This market would predict whether Solana will actually reach the milestone of
                          processing 1 million transactions per second in a verifiable test by December 31, 2024. Solana
                          has been working on improving its transaction throughput, and they claim they can handle high
                          TPS. This market would predict whether Solana will actually reach the milestone of processing 1
                          million transactions per second in a verifiable test by December 31, 2024.`,
  outcomeResolutionDef: 'Outcome.'
};

const processPredictionSet = async () => {
  const context = await createContext();

  try {
    for (let i = 0; i < 100; i++) {
      await new Proposal(data, context).insert();
    }
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
