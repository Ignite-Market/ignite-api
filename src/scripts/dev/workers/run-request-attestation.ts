import { exit } from 'process';
import { createContext } from '../../../lib/utils';
import { WorkerDefinition } from '../../../lib/worker/serverless-workers';
import { VotingParserWorker } from '../../../workers/voting-parser.worker';
import { WorkerName } from '../../../workers/worker-executor';
import { RequestAttestationWorker } from '../../../workers/flare/request-attestation.worker';
import { RequestAttestationProofWorker } from '../../../workers/flare/request-attestation-proof.worker';

(async () => {
  const start = new Date();
  const context = await createContext();

  const wd = new WorkerDefinition(null, WorkerName.REQUEST_ATTESTATION_PROOF);
  const workerExecute = new RequestAttestationProofWorker(wd, context);
  await workerExecute.runExecutor();

  const end = new Date();
  console.log('Duration: ', (end.getTime() - start.getTime()) / 1000, 's');

  await context.mysql.close();
  exit(0);
})().catch(async (err) => {
  console.log(err);
  exit(1);
});
