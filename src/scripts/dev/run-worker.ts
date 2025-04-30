import { exit } from 'process';
import { createContext } from '../../lib/utils';
import { WorkerDefinition } from '../../lib/worker/serverless-workers';
import { CollateralTokenUsdPriceWorker } from '../../workers/collateral-token-usd-price.worker';
import { WorkerName } from '../../workers/worker-executor';

const WORKER_NAME = WorkerName.COLLATERAL_TOKEN_USD_PRICE;
const WorkerClass = CollateralTokenUsdPriceWorker;

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
