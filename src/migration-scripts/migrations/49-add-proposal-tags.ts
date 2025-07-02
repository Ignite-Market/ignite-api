import { DbTables, SqlModelStatus } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL}\`
    ADD COLUMN \`tags\` VARCHAR(255) NULL AFTER \`outcomes\`,
    ADD INDEX \`idx_proposal__tag\` (\`tag\`(100)) VISIBLE;
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL}\`
    DROP INDEX \`idx_proposal__tag\`,
    DROP COLUMN \`tags\`;
  `);
}
