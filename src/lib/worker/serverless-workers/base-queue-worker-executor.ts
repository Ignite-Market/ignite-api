import { env } from '../../../config/env';
import { Context } from '../../../context';
import { BaseQueueWorker, QueueWorkerType } from './base-queue-worker';
import { WorkerDefinition } from './worker-definition';

/**
 * Base queue worker executor.
 */
export abstract class BaseQueueWorkerExecutor extends BaseQueueWorker {
  /**
   * Override constructor with default executor values.
   *
   * @param workerDefinition Worker definition.
   * @param context Application context.
   */
  public constructor(workerDefinition: WorkerDefinition, context: Context) {
    super(workerDefinition, context, QueueWorkerType.EXECUTOR, env.AWS_WORKER_SQS_URL);
  }

  /**
   * Override planner since we don't need it.
   */
  public async runPlanner(): Promise<Array<any>> {
    return;
  }

  /**
   * Execution function needs to be overridden.
   * @param data Executor data.
   */
  public abstract runExecutor(data: any): Promise<any>;
}
