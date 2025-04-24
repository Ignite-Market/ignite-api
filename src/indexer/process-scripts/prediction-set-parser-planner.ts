import { Logger } from '@nestjs/common';
import * as pm2 from 'pm2';
import { DbTables, SqlModelStatus } from '../../config/types';
import { PredictionSetStatus } from '../../modules/prediction-set/models/prediction-set.model';
import { BaseProcess } from '../base-process';
import { ProcessName } from '../types';

/**
 * Main execution function for the prediction set parser planner.
 */
async function main() {
  const workerProcess = new BaseProcess(ProcessName.PREDICTION_SET_PARSER);

  try {
    Logger.log('prediction-set-parser-planner.ts', 'main', 'Starting prediction set parser planner process...');
    await workerProcess.initialize(true);

    let predictionSetIds = await workerProcess.context.mysql.paramExecute(
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
    predictionSetIds = predictionSetIds.map((d) => d.id);

    for (const predictionSetId of predictionSetIds) {
      try {
        await new Promise((resolve, reject) => {
          pm2.start(
            {
              script: `./dist/indexer/process-scripts/prediction-set-parser.js`,
              name: `${ProcessName.PREDICTION_SET_PARSER}_${predictionSetId}`,
              args: [predictionSetId],
              instances: 1,
              exec_mode: 'fork',
              autorestart: false
            },
            (error) => {
              if (error) {
                reject(error);
              }
              resolve(true);
            }
          );
        });
      } catch (error) {
        // Throw error.
        Logger.error('prediction-set-parser-planner.ts', 'main', 'Error starting prediction set parser planner process:', error);
      }
    }

    Logger.log('prediction-set-parser-planner.ts', 'main', 'Prediction set parser planner process completed successfully');
  } catch (error) {
    Logger.error('prediction-set-parser-planner.ts', 'main', 'Error executing prediction set parser planner process:', error);
    process.exit(1);
  } finally {
    await workerProcess.shutdown();
  }
}

main();

// BATCHING APPROACHES:

// import Queue from 'better-queue';

// const processQueue = new Queue(
//   async (predictionSetId, cb) => {
//     try {
//       await new Promise((resolve) => {
//         pm2.start(
//           {
//             script: `./dist/indexer/process-scripts/prediction-set-parser.js`,
//             name: `${ProcessName.PREDICTION_SET_PARSER}_${predictionSetId}`,
//             args: [predictionSetId]
//           },
//           () => resolve(true)
//         );
//       });
//       cb(null);
//     } catch (error) {
//       cb(error);
//     }
//   },
//   {
//     concurrent: 5,
//     maxRetries: 3
//   }
// );

// // Add all IDs to queue
// for (const predictionSetId of predictionSetIds) {
//   processQueue.push(predictionSetId);
// }

// // Wait for queue to finish
// await new Promise((resolve) => {
//   processQueue.on('drain', resolve);
// });

// // Process in batches of 5
// const batchSize = 5;
// for (let i = 0; i < predictionSetIds.length; i += batchSize) {
//   const batch = predictionSetIds.slice(i, i + batchSize);

//   // Start batch processes
//   const promises = batch.map(id => new Promise((resolve, reject) => {
//     pm2.start({
//       script: `./dist/indexer/process-scripts/prediction-set-parser.js`,
//       name: `${ProcessName.PREDICTION_SET_PARSER}_${id}`,
//       args: [id]
//     }, (error) => {
//       if (error) reject(error);
//       else resolve(true);
//     });
//   }));

//   // Wait for current batch to complete
//   await Promise.all(promises);
// }
