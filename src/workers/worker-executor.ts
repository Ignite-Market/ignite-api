import { env, getEnvSecrets } from '../config/env';
import { AppEnvironment } from '../config/types';
import { Context } from '../context';
import { MySql } from '../lib/database/mysql';
import { WorkerLogStatus, writeWorkerLog } from '../lib/worker/logger';
import { ServiceDefinition, ServiceDefinitionType, WorkerDefinition } from '../lib/worker/serverless-workers';
import { QueueWorkerType } from '../lib/worker/serverless-workers/base-queue-worker';
import { CreatePredictionSetWorker } from './create-prediction-set.worker';
import { FinalizeManualPredictionSetWorker } from './finalize-manual-prediction-sets.worker';
import { FinalizeProposalRoundsWorker } from './finalize-proposal-rounds.worker';
import { FinalizeAutomaticPredictionSetWorker } from './flare/finalize-automatic-prediction-sets.worker';
import { RequestAttestationProofWorker } from './flare/request-attestation-proof.worker';
import { RequestAttestationWorker } from './flare/request-attestation.worker';
import { PredictionSetParserWorker } from './prediction-set-parser.worker';
import { PredictionSetsFactoryParserWorker } from './prediction-sets-factory-parser.worker';
import { RefreshOutcomeChancesWorker } from './refresh-outcome-chances.worker';
import { Scheduler } from './scheduler';
import { VotingParserWorker } from './voting-parser.worker';

/**
 * Worker names definition.
 */
export enum WorkerName {
  SCHEDULER = 'Scheduler',
  CREATE_PREDICTION_SET = 'CreatePredictionSet',
  FINALIZE_MANUAL_PREDICTION_SET = 'FinalizeManualPredictionSet',
  FINALIZE_AUTOMATIC_PREDICTION_SET = 'FinalizeAutomaticPredictionSet',
  PREDICTION_SET_PARSER = 'PredictionSetParser',
  PREDICTION_SETS_FACTORY_PARSER = 'PredictionSetsFactoryParser',
  REFRESH_OUTCOME_CHANCES = 'RefreshOutcomeChances',
  REQUEST_ATTESTATION_PROOF = 'RequestAttestationProof',
  REQUEST_ATTESTATION = 'RequestAttestation',
  VOTING_PARSER = 'VotingParser',
  FINALIZE_PROPOSAL_ROUNDS = 'FinalizeProposalRounds',
  CLAIMS_PARSER = 'ClaimsParser'
}

/**
 * Worker event handler.
 *
 * @param event Worker event.
 */
export async function handler(event: any) {
  await getEnvSecrets();

  const options = {
    host: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_HOST_TEST : env.MYSQL_HOST,
    port: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PORT_TEST : env.MYSQL_PORT,
    database: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_DATABASE_TEST : env.MYSQL_DATABASE,
    user: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_USER_TEST : env.MYSQL_USER,
    password: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PASSWORD_TEST : env.MYSQL_PASSWORD
  };

  const mysql = new MySql(options);
  await mysql.connect();
  const context = new Context();
  context.setMySql(mysql);

  const serviceDef = {
    type: ServiceDefinitionType.LAMBDA,
    config: { region: env.AWS_REGION },
    params: { FunctionName: env.AWS_WORKER_LAMBDA_NAME }
  };

  console.log('WORKER EVENT: ', event);
  console.log('WORKER MESSAGE JSON: ', JSON.stringify(event));

  try {
    let response: any;
    if (event.Records) {
      response = await handleSqsMessages(event, context, serviceDef);
    } else {
      response = await handleLambdaEvent(event, context, serviceDef);
    }
    await context.mysql.close();

    return response;
  } catch (error) {
    console.error('ERROR HANDLING LAMBDA!');
    console.error(error.message);

    await context.mysql.close();
    throw error;
  }
}

/**
 * Handles lambda invocation event.
 * @param event Lambda invocation event.
 * @param context Application context.
 * @param serviceDef Service definition.
 */
export async function handleLambdaEvent(event: any, context: Context, serviceDef: ServiceDefinition) {
  let workerDefinition: WorkerDefinition;
  if (event.workerName) {
    workerDefinition = new WorkerDefinition(serviceDef, event.workerName, event);
  } else {
    workerDefinition = new WorkerDefinition(serviceDef, WorkerName.SCHEDULER);
  }

  switch (workerDefinition.workerName) {
    case WorkerName.SCHEDULER:
      await new Scheduler(serviceDef, context).run();
      break;

    case WorkerName.CREATE_PREDICTION_SET:
      await new CreatePredictionSetWorker(workerDefinition, context).run();
      break;

    case WorkerName.FINALIZE_AUTOMATIC_PREDICTION_SET:
      await new FinalizeAutomaticPredictionSetWorker(workerDefinition, context).run();
      break;

    case WorkerName.FINALIZE_MANUAL_PREDICTION_SET:
      await new FinalizeManualPredictionSetWorker(workerDefinition, context).run();
      break;

    case WorkerName.PREDICTION_SET_PARSER:
      await new PredictionSetParserWorker(workerDefinition, context, QueueWorkerType.PLANNER).run();
      break;

    case WorkerName.PREDICTION_SETS_FACTORY_PARSER:
      await new PredictionSetsFactoryParserWorker(workerDefinition, context).run();
      break;

    case WorkerName.REFRESH_OUTCOME_CHANCES:
      await new RefreshOutcomeChancesWorker(workerDefinition, context, QueueWorkerType.PLANNER).run();
      break;

    case WorkerName.REQUEST_ATTESTATION_PROOF:
      await new RequestAttestationProofWorker(workerDefinition, context).run();
      break;

    case WorkerName.REQUEST_ATTESTATION:
      await new RequestAttestationWorker(workerDefinition, context).run();
      break;

    case WorkerName.VOTING_PARSER:
      await new VotingParserWorker(workerDefinition, context).run();
      break;

    case WorkerName.FINALIZE_PROPOSAL_ROUNDS:
      await new FinalizeProposalRoundsWorker(workerDefinition, context).run();
      break;

    default:
      console.error(`ERROR - INVALID WORKER NAME: ${workerDefinition.workerName}`);
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
 * Handles SQS event messages.
 *
 * @param event SQS event.
 * @param context Application context.
 * @param serviceDef service definitions.
 */
export async function handleSqsMessages(event: any, context: Context, serviceDef: ServiceDefinition) {
  console.info('handle sqs message. event.Records: ', event.Records);
  const response = { batchItemFailures: [] };

  for (const message of event.Records) {
    try {
      let parameters: any;
      if (message?.messageAttributes?.parameters?.stringValue) {
        parameters = JSON.parse(message?.messageAttributes?.parameters?.stringValue);
      }

      let id: number;
      if (message?.messageAttributes?.jobId?.stringValue) {
        id = parseInt(message?.messageAttributes?.jobId?.stringValue);
      }

      let workerName = message?.messageAttributes?.workerName?.stringValue;
      if (!workerName) {
        console.info('Worker name not present in message.messageAttributes!');
      }

      const workerDefinition = new WorkerDefinition(serviceDef, workerName, {
        id,
        parameters
      });

      switch (workerName) {
        case WorkerName.CREATE_PREDICTION_SET:
          await new CreatePredictionSetWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.FINALIZE_AUTOMATIC_PREDICTION_SET:
          await new FinalizeAutomaticPredictionSetWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.FINALIZE_MANUAL_PREDICTION_SET:
          await new FinalizeManualPredictionSetWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.PREDICTION_SET_PARSER:
          await new PredictionSetParserWorker(workerDefinition, context, QueueWorkerType.EXECUTOR).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.PREDICTION_SETS_FACTORY_PARSER:
          await new PredictionSetsFactoryParserWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.REFRESH_OUTCOME_CHANCES:
          await new RefreshOutcomeChancesWorker(workerDefinition, context, QueueWorkerType.EXECUTOR).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.REQUEST_ATTESTATION_PROOF:
          await new RequestAttestationProofWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.REQUEST_ATTESTATION:
          await new RequestAttestationWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.VOTING_PARSER:
          await new VotingParserWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        case WorkerName.FINALIZE_PROPOSAL_ROUNDS:
          await new FinalizeProposalRoundsWorker(workerDefinition, context).run({
            executeArg: message?.body
          });
          break;

        default:
          console.log(`ERROR - INVALID WORKER NAME: ${message?.messageAttributes?.workerName}`);
      }
    } catch (error) {
      console.log(error);
      response.batchItemFailures.push({ itemIdentifier: message.messageId });
    }
  }
  return response;
}
