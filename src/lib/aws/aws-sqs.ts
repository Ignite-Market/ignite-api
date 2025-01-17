import type { SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { env } from '../../config/env';
import { AppEnvironment } from '../../config/types';
import { Context } from '../../context';
import { WorkerName } from '../../workers/worker-executor';
import { testSendToWorkerQueue } from './aws-test';

/**
 * Creates an SQS client.
 * @returns SQSClient.
 */
export function createSqsClient() {
  return new SQSClient({
    credentials: {
      accessKeyId: env.AWS_KEY,
      secretAccessKey: env.AWS_SECRET
    },
    region: env.AWS_REGION
  });
}

/**
 * Sends a message to an SQS worker queue.
 * @param workerName The name of the worker.
 * @param msgData The data to send.
 * @param id The ID of the message.
 * @param parameters The parameters of the message.
 * @param delaySeconds The number of seconds to delay the message.
 * @returns The number of errors and the error messages.
 */
export async function sendToWorkerQueue(
  workerName: WorkerName,
  msgData: Array<any>,
  context: Context = null,
  id: number = null,
  parameters: any[] = null,
  delaySeconds = 0
) {
  await sendToQueue(env.AWS_WORKER_SQS_URL, workerName, msgData, context, id, parameters, delaySeconds);
}

/**
 * Sends a message to an SQS queue.
 * @param queueUrl The URL of the SQS queue.
 * @param workerName The name of the worker.
 * @param msgData The data to send.
 * @param id The ID of the message.
 * @param parameters The parameters of the message.
 * @param delaySeconds The number of seconds to delay the message.
 * @returns The number of errors and the error messages.
 */
export async function sendToQueue(
  queueUrl: string,
  workerName: WorkerName,
  msgData: Array<any>,
  context: Context = null,
  id: number = null,
  parameters: any[] = null,
  delaySeconds = 0
): Promise<{ errCount: number; errMsgs: string[] }> {
  // If we are running in test mode, do not send the message to the queue, but execute worker directly.
  if (env.APP_ENV === AppEnvironment.TEST || env.APP_ENV === AppEnvironment.LOCAL_DEV) {
    // return await testSendToWorkerQueue(workerName, msgData, context); // Circular dependency.....
    return;
  }

  const sqs = createSqsClient();
  let errCount = 0;
  const errMsgs = [];
  const promises = [];

  for (const msg of msgData) {
    const message: SendMessageCommandInput = {
      MessageAttributes: {
        workerName: {
          DataType: 'String',
          StringValue: workerName
        },
        ...(id
          ? {
              jobId: {
                DataType: 'String',
                StringValue: id.toString()
              }
            }
          : {}),
        parameters: {
          DataType: 'String',
          StringValue: JSON.stringify(parameters)
        }
      },
      MessageBody: JSON.stringify(typeof msg.serialize == 'function' ? msg.serialize() : msg),
      QueueUrl: queueUrl,
      DelaySeconds: delaySeconds
    };

    if (!parameters) {
      delete message.MessageAttributes.parameters;
    }

    const command = new SendMessageCommand(message);
    const promise = sqs.send(command).catch((err) => {
      console.log('sendToWorkerQueue: Error sending SQS message!', err);
      errCount++;
      errMsgs.push(err.message);
    });

    promises.push(promise);
  }
  await Promise.all(promises);

  if (errCount) {
    console.log('sendToWorkerQueue: Errors detected while sending messages to queue', {
      errCount,
      errMsgs: JSON.stringify(errMsgs)
    });
  }

  return { errCount, errMsgs };
}
