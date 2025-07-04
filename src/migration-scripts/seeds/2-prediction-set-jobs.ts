import { DbTables } from '../../config/types';
import { WorkerName } from '../../workers/worker-executor';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    INSERT INTO ${DbTables.JOB} (
      \`name\`,
      \`channel\`,
      \`interval\`,
      \`status\`
      )
      VALUES
      ('${WorkerName.FINALIZE_MANUAL_PREDICTION_SET}', 0, '* * * * *', 5),
      ('${WorkerName.VOTING_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.PREDICTION_SET_FINALIZED_PARSER}', 0, '*/15 * * * *', 5),
      ('${WorkerName.PREDICTION_SETS_FACTORY_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.REFRESH_OUTCOME_CHANCES}', 0, '*/5 * * * *', 5),
      ('${WorkerName.FINALIZE_PROPOSAL_ROUNDS}', 0, '*/5 * * * *', 5),
      ('${WorkerName.CLAIMS_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.COLLATERAL_TOKEN_USD_PRICE}', 0, '* * * * *', 5),
      ('${WorkerName.INDEXER_HEALTH_CHECK}', 0, '* * * * *', 5)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.FINALIZE_MANUAL_PREDICTION_SET}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.VOTING_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.PREDICTION_SET_FINALIZED_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.PREDICTION_SETS_FACTORY_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.REFRESH_OUTCOME_CHANCES}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.CLAIMS_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.COLLATERAL_TOKEN_USD_PRICE}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.INDEXER_HEALTH_CHECK}');
  `);
}
