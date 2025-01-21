import { exit } from 'process';
import { WorkerDefinition } from '../../../lib/worker/serverless-workers';
import { QueueWorkerType } from '../../../lib/worker/serverless-workers/base-queue-worker';
import { PredictionSetParserWorker } from '../../../workers/prediction-set-parser.worker';
import { WorkerName } from '../../../workers/worker-executor';
import { createContext } from '../context';

const PREDICTION_SET_ID = 39;

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
