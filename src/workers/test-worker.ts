import {
  BaseQueueWorker,
  QueueWorkerType,
} from '../lib/worker/serverless-workers/base-queue-worker';
import { WorkerDefinition } from '../lib/worker/serverless-workers';
import { Context } from '../context';
import { env } from '../config/env';

export class TestWorker extends BaseQueueWorker {
  public constructor(
    workerDefinition: WorkerDefinition,
    context: Context,
    type: QueueWorkerType
  ) {
    super(workerDefinition, context, type, env.AWS_WORKER_SQS_URL);
  }

  public async runPlanner(): Promise<Array<any>> {
    // Dummy planner that creates 3 test messages
    return [
      { id: 1, message: 'Test message 1' },
      { id: 2, message: 'Test message 2' },
      { id: 3, message: 'Test message 3' },
    ];
  }

  public async runExecutor(data: any): Promise<any> {
    // Dummy executor that logs the received message
    console.log('Executing test worker with data:', data);
    return {
      success: true,
      processedData: data,
      timestamp: new Date().toISOString(),
    };
  }
}
