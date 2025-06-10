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
      ('${WorkerName.FINALIZE_AUTOMATIC_PREDICTION_SET}', 0, '* * * * *', 5),
      ('${WorkerName.REQUEST_ATTESTATION_PROOF}', 0, '* * * * *', 5),
      ('${WorkerName.REQUEST_ATTESTATION}', 0, '*/15 * * * *', 5)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.FINALIZE_AUTOMATIC_PREDICTION_SET}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.REQUEST_ATTESTATION_PROOF}');
    DELETE FROM ${DbTables.JOB} WHERE name IN ('${WorkerName.REQUEST_ATTESTATION}');
  `);
}
