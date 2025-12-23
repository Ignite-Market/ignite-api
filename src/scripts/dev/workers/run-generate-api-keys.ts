import { exit } from 'process';
import { createContext } from '../../../lib/utils';
import { WorkerDefinition } from '../../../lib/worker/serverless-workers';
import { GenerateApiKeysWorker } from '../../../workers/generate-api-keys.worker';
import { WorkerName } from '../../../workers/worker-executor';

(async () => {
  const start = new Date();
  const context = await createContext();

  const wd = new WorkerDefinition(null, WorkerName.GENERATE_API_KEYS);
  const workerExecute = new GenerateApiKeysWorker(wd, context);
  await workerExecute.execute();

  const end = new Date();
  console.log('Duration: ', (end.getTime() - start.getTime()) / 1000, 's');

  await context.mysql.close();
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
