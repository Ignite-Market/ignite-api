import { Context } from '../../context';
import { CreatePredictionSetWorker } from '../../workers/create-prediction-set.worker';
import { WorkerName } from '../../workers/worker-executor';
import { WorkerDefinition } from '../worker/serverless-workers';

/**
 * Sends a message to an SQS queue for testing.
 * @param queueUrl The URL of the SQS queue.
 * @param workerName The name of the worker.
 * @param msgData The data to send.
 * @returns The number of errors and the error messages.
 */
export async function testSendToWorkerQueue(
  workerName: WorkerName,
  msgData: Array<any>,
  context: Context
): Promise<{ errCount: number; errMsgs: string[] }> {
  for (const msg of msgData) {
    switch (workerName) {
      case WorkerName.CREATE_PREDICTION_SET:
        await new CreatePredictionSetWorker(
          new WorkerDefinition(null, WorkerName.CREATE_PREDICTION_SET, {
            parameters: msg
          }),
          context
        ).run({
          executeArg: msg
        });

        break;

      default:
        break;
    }
  }
  return { errCount: 0, errMsgs: [] };
}
