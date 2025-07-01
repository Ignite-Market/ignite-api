import { Logger } from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { DbTables, SqlModelStatus } from '../../config/types';
import { ChannelList, sendSlackWebhook } from '../../lib/slack-webhook';
import { WorkerLogStatus } from '../../lib/worker/logger';
import { PredictionSetStatus } from '../../modules/prediction-set/models/prediction-set.model';
import { BaseProcess } from '../base-process';
import { ProcessName } from '../types';

/**
 * Map of currently running parser child-processes keyed by prediction-set ID.
 */
const RUNNING_PARSERS: Map<number, ChildProcess> = new Map();

/**
 * Start a parser for a prediction set.
 * @param predictionSetId Prediction set ID.
 * @returns Whether a new child was actually spawned.
 */
function startParser(predictionSetId: number): boolean {
  if (RUNNING_PARSERS.has(predictionSetId)) {
    return false;
  }

  const processName = `${ProcessName.PREDICTION_SET_PARSER}_${predictionSetId}`;
  const child = spawn('node', ['dist/indexer/process-scripts/prediction-set-parser.js', predictionSetId.toString(), processName], {
    stdio: 'inherit'
  });

  RUNNING_PARSERS.set(predictionSetId, child);

  child.on('exit', (code, signal) => {
    RUNNING_PARSERS.delete(predictionSetId);
    if (code !== 0) {
      Logger.warn(`Parser ${predictionSetId} exited (code=${code}, signal=${signal}). Restarting…`, 'parser-planner');
      startParser(predictionSetId);
    }
  });

  return true;
}

/**
 * Stop a parser for a prediction set.
 * @param predictionSetId Prediction set ID.
 */
function stopParser(predictionSetId: number) {
  const child = RUNNING_PARSERS.get(predictionSetId);
  if (!child) {
    Logger.warn(`Parser for prediction set ${predictionSetId} not found.`, 'prediction-set-parser-planner.ts/stopParser');
    return;
  }

  child.kill('SIGINT');
  RUNNING_PARSERS.delete(predictionSetId);
}

/**
 * Execute the planner.
 * @param workerProcess Worker process.
 */
async function executePlanner(workerProcess: BaseProcess) {
  let predictionSetIds: number[] = await workerProcess.context.mysql.paramExecute(
    `
      SELECT ps.id
      FROM ${DbTables.PREDICTION_SET} ps
      INNER JOIN ${DbTables.PREDICTION_SET_CHAIN_DATA} cd
        ON ps.id = cd.prediction_set_id
      WHERE 
        ps.setStatus IN (${PredictionSetStatus.ACTIVE}, ${PredictionSetStatus.FUNDING})
        AND ps.status = ${SqlModelStatus.ACTIVE}
        AND cd.status = ${SqlModelStatus.ACTIVE}
        AND cd.contractAddress IS NOT NULL
    `,
    {}
  );
  predictionSetIds = predictionSetIds.map((d: any) => d.id);

  Logger.log(`Found ${predictionSetIds.length} active / funding prediction sets.`, 'prediction-set-parser-planner.ts/executePlanner');

  // Start parsers for active / funding prediction sets.
  for (const id of predictionSetIds) {
    const started = startParser(id);
    if (started) {
      Logger.log(`Started parser for prediction set ${id}.`, 'prediction-set-parser-planner.ts/executePlanner');
    }
  }

  // Stop parsers for prediction sets that are no longer active / funding.
  for (const id of Array.from(RUNNING_PARSERS.keys())) {
    if (!predictionSetIds.includes(id)) {
      stopParser(id);
      Logger.log(`Stopped obsolete parser for prediction set ${id}.`, 'prediction-set-parser-planner.ts/executePlanner');
    }
  }
}

/**
 * Main execution function for the prediction set parser planner.
 */
async function main() {
  const workerProcess = new BaseProcess(ProcessName.PREDICTION_SET_PARSER_PLANNER);

  try {
    Logger.log('Starting prediction set parser planner process...', 'prediction-set-parser-planner.ts/main');
    await workerProcess.initialize();

    await executePlanner(workerProcess);
    setInterval(() => executePlanner(workerProcess).catch((e) => Logger.error(e)), env.INDEXER_PREDICTION_SET_PLANNER_INTERVAL * 1000);

    Logger.log(
      `Prediction set parser planner running (loop every ${env.INDEXER_PREDICTION_SET_PLANNER_INTERVAL} s).`,
      'prediction-set-parser-planner.ts/main'
    );
  } catch (error) {
    const errorId = randomUUID();
    await sendSlackWebhook(
      `
      *[INDEXER ERROR]*: Error while parsing prediction sets. See DB worker logs for more info: \n
      - Error ID: \`${errorId}\`
      `,
      true,
      ChannelList.INDEXER
    );

    await workerProcess.writeLogToDb(WorkerLogStatus.ERROR, `Error executing prediction set parser planner process:`, null, error, errorId);

    Logger.error('Error executing prediction set parser planner process:', error, 'prediction-set-parser-planner.ts/main');
    process.exit(1);
  }
}

main();
