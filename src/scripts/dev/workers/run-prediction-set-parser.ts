import { exit } from 'process';
import { RefreshOutcomeChancesWorker } from '../../../workers/refresh-outcome-chances.worker';
import { WorkerName } from '../../../workers/worker-executor';
import { createContext } from '../context';
import { WorkerDefinition } from '../../../lib/worker/serverless-workers';
import { QueueWorkerType } from '../../../lib/worker/serverless-workers/base-queue-worker';
import { PredictionSetParserWorker } from '../../../workers/prediction-set-parser.worker';

const PREDICTION_SET_ID = 36;

(async () => {
  const start = new Date();
  const context = await createContext();

  const wd = new WorkerDefinition(null, WorkerName.PREDICTION_SET_PARSER);
  const workerExecute = new PredictionSetParserWorker(wd, context, QueueWorkerType.EXECUTOR);
  await workerExecute.runExecutor(PREDICTION_SET_ID);

  const end = new Date();
  console.log('Duration: ', (end.getTime() - start.getTime()) / 1000, 's');

  await context.mysql.close();
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
