import { exit } from 'process';
import { createContext } from '../../lib/utils';
import { WorkerDefinition } from '../../lib/worker/serverless-workers';
import { ClaimsParserWorker } from '../../workers/claims-parser.worker';
import { WorkerName } from '../../workers/worker-executor';

const WORKER_NAME = WorkerName.CLAIMS_PARSER;
const WorkerClass = ClaimsParserWorker;

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
