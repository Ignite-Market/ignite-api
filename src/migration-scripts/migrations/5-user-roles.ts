import { DbTables } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.USER_ROLES}\` (
    \`user_id\` INT NOT NULL,
    \`role_id\` INT NOT NULL,
    PRIMARY KEY (\`user_id\`, \`role_id\`))
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.USER_ROLES}\`;
  `);
}
