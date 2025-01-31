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
      ('${WorkerName.VOTING_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.PREDICTION_SET_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.PREDICTION_SETS_FACTORY_PARSER}', 0, '* * * * *', 5),
      ('${WorkerName.REFRESH_OUTCOME_CHANCES}', 0, '*/15 * * * *', 5)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.VOTING_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.PREDICTION_SET_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.PREDICTION_SETS_FACTORY_PARSER}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.REFRESH_OUTCOME_CHANCES}');
  `);
}
