import { DbTables } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PREDICTION_SET_DATA_SOURCE}\` (
    \`prediction_set_id\` INT NOT NULL,
    \`data_source_id\` INT NOT NULL,
    PRIMARY KEY (\`prediction_set_id\`, \`data_source_id\`))
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.PREDICTION_SET_DATA_SOURCE}\`;
  `);
}
