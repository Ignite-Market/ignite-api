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
      ('${WorkerName.GENERATE_API_KEYS}', 0, '0 0 * * *', 5)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.GENERATE_API_KEYS}');
  `);
}
