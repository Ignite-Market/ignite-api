import { Context } from '../../context';
import { ServiceDefinitionType, WorkerDefinition } from '../../lib/worker/serverless-workers';
import { QueueWorkerType } from '../../lib/worker/serverless-workers/base-queue-worker';
import { setupTest, Stage } from '../../../test/setup';
import { releaseStage } from '../../../test/setup-context-and-sql';
import { WorkerName } from '../worker-executor';
import { TestWorker } from '../test-worker';

describe('TestWorker', () => {
  let stage: Stage;
  let worker: TestWorker;
  let context: Context;
  let workerDefinition: WorkerDefinition;

  beforeAll(async () => {
    stage = await setupTest();
    context = stage.context;

    workerDefinition = new WorkerDefinition(
      {
        type: ServiceDefinitionType.LAMBDA,
        config: { region: 'eu-west-1' },
        params: { FunctionName: 'test-worker' }
      },
      WorkerName.TEST
    );
  });

  afterAll(async () => {
    await releaseStage(stage);
  });

  describe('Planner', () => {
    beforeEach(() => {
      worker = new TestWorker(workerDefinition, context, QueueWorkerType.PLANNER);
    });

    it('should return an array of test messages', async () => {
      const result = await worker.runPlanner();

      expect(Array.isArray(result)).toBeTruthy();
      expect(result.length).toBe(3);
      expect(result[0]).toMatchObject({
        id: 1,
        message: 'Test message 1'
      });
    });
  });

  describe('Executor', () => {
    beforeEach(() => {
      worker = new TestWorker(workerDefinition, context, QueueWorkerType.EXECUTOR);
    });

    it('should process test message and return success response', async () => {
      const testData = { id: 1, message: 'Test message 1' };
      const result = await worker.runExecutor(testData);

      expect(result).toMatchObject({
        success: true,
        processedData: testData
      });
      expect(result.timestamp).toBeDefined();
    });
  });
});
