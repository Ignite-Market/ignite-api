import { exit } from 'process';
import { WorkerDefinition } from '../../lib/worker/serverless-workers';
import { PredictionSetsFactoryParserWorker } from '../../workers/prediction-sets-factory-parser.worker';
import { WorkerName } from '../../workers/worker-executor';
import { createContext } from './context';
import { FinalizeAutomaticPredictionSetWorker } from '../../workers/flare/finalize-automatic-prediction-sets.worker';
import { RequestAttestationWorker } from '../../workers/flare/request-attestation.worker';
import { RequestAttestationProofWorker } from '../../workers/flare/request-attestation-proof.worker';
import { FinalizeManualPredictionSetWorker } from '../../workers/finalize-manual-prediction-sets.worker';

const WORKER_NAME = WorkerName.FINALIZE_AUTOMATIC_PREDICTION_SET;
const WorkerClass = FinalizeAutomaticPredictionSetWorker;

(async () => {
  const start = new Date();
  const context = await createContext();

  const wd = new WorkerDefinition(null, WORKER_NAME);
  const workerExecute = new WorkerClass(wd, context);
  await workerExecute.execute(null as any);

  const end = new Date();
  console.log('Duration: ', (end.getTime() - start.getTime()) / 1000, 's');

  await context.mysql.close();
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
