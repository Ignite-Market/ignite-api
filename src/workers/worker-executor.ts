import { env, getEnvSecrets } from '../config/env';
import { AppEnvironment } from '../config/types';
import { Context } from '../context';
import { MySql } from '../lib/database/mysql';

import { WorkerLogStatus, writeWorkerLog } from '../lib/worker/logger';
import {
  QueueWorkerType,
  ServiceDefinition,
  ServiceDefinitionType,
  WorkerDefinition,
} from '../lib/worker/serverless-workers';

import { Scheduler } from './scheduler';
import { TestWorker } from './test-worker';

export enum WorkerName {
  SCHEDULER = 'scheduler',
  TEST = 'test',
}

export async function handler(event: any) {
  await getEnvSecrets();

  const options = {
    host:
      env.APP_ENV === AppEnvironment.TEST
        ? env.MYSQL_HOST_TEST
        : env.MYSQL_HOST,
    port:
      env.APP_ENV === AppEnvironment.TEST
        ? env.MYSQL_PORT_TEST
        : env.MYSQL_PORT,
    database:
      env.APP_ENV === AppEnvironment.TEST
        ? env.MYSQL_DATABASE_TEST
        : env.MYSQL_DATABASE,
    user:
      env.APP_ENV === AppEnvironment.TEST
        ? env.MYSQL_USER_TEST
        : env.MYSQL_USER,
    password:
      env.APP_ENV === AppEnvironment.TEST
        ? env.MYSQL_PASSWORD_TEST
        : env.MYSQL_PASSWORD,
  };

  const mysql = new MySql(options);
  await mysql.connect();
  const context = new Context();
  context.setMySql(mysql);

  const serviceDef = {
    type: ServiceDefinitionType.LAMBDA,
    config: { region: env.AWS_REGION },
    params: { FunctionName: env.AWS_WORKER_LAMBDA_NAME },
  };

  console.info(`EVENT: ${JSON.stringify(event)}`);

  try {
    let resp;
    if (event.Records) {
      resp = await handleSqsMessages(event, context, serviceDef);
    } else {
      resp = await handleLambdaEvent(event, context, serviceDef);
    }
    await context.mysql.close();
    return resp;
  } catch (e) {
    console.error('ERROR HANDLING LAMBDA!');
    console.error(e.message);
    await context.mysql.close();
    throw e;
  }
}

/**
 * Handles lambda invocation event
 * @param event Lambda invocation event
 * @param context App context
 * @param serviceDef Service definition
 */
export async function handleLambdaEvent(
  event: any,
  context: Context,
  serviceDef: ServiceDefinition
) {
  let workerDefinition;
  if (event.workerName) {
    workerDefinition = new WorkerDefinition(
      serviceDef,
      event.workerName,
      event
    );
  } else {
    workerDefinition = new WorkerDefinition(serviceDef, WorkerName.SCHEDULER);
  }

  // eslint-disable-next-line sonarjs/no-small-switch
  switch (workerDefinition.workerName) {
    case WorkerName.SCHEDULER:
      const scheduler = new Scheduler(serviceDef, context);
      await scheduler.run();
      break;
    case WorkerName.TEST:
      const worker = new TestWorker(
        workerDefinition,
        context,
        QueueWorkerType.PLANNER
      );
      await worker.run();
      break;
    default:
      console.error(
        `ERROR - INVALID WORKER NAME: ${workerDefinition.workerName}`
      );
      await writeWorkerLog(
        context,
        WorkerLogStatus.ERROR,
        workerDefinition.workerName,
        null,
        `ERROR - INVALID WORKER NAME: ${workerDefinition.workerName}`
      );
  }
}

/**
 * Handles SQS event messages
 * @param event SQS event
 * @param context App context
 * @param serviceDef service definitions
 */
export async function handleSqsMessages(
  event: any,
  context: Context,
  serviceDef: ServiceDefinition
) {
  console.info('handle sqs message. event.Records: ', event.Records);
  const response = { batchItemFailures: [] };
  for (const message of event.Records) {
    try {
      let parameters: any;
      if (message?.messageAttributes?.parameters?.stringValue) {
        parameters = JSON.parse(
          message?.messageAttributes?.parameters?.stringValue
        );
      }

      let id: number;
      if (message?.messageAttributes?.jobId?.stringValue) {
        id = parseInt(message?.messageAttributes?.jobId?.stringValue);
      }

      let workerName = message?.messageAttributes?.workerName?.stringValue;
      if (!workerName) {
        //Worker name is not present in messageAttributes
        console.info('worker name not present in message.messageAttributes');
      }

      const workerDefinition = new WorkerDefinition(serviceDef, workerName, {
        id,
        parameters,
      });

      // eslint-disable-next-line sonarjs/no-small-switch
      switch (workerName) {
        case WorkerName.TEST:
          const worker = new TestWorker(
            workerDefinition,
            context,
            QueueWorkerType.EXECUTOR
          );
          await worker.run({
            executeArg: message?.body,
          });
          break;
        // case WorkerName.PASSIVE_EARNING:
        //   const worker = new PassiveEarningWorker(
        //     workerDefinition,
        //     context,
        //     QueueWorkerType.EXECUTOR
        //   );
        //   await worker.run({
        //     executeArg: message?.body,
        //   });
        //   break;
        default:
          console.log(
            `ERROR - INVALID WORKER NAME: ${message?.messageAttributes?.workerName}`
          );
      }
    } catch (error) {
      console.log(error);
      response.batchItemFailures.push({ itemIdentifier: message.messageId });
    }
  }
  return response;
}
