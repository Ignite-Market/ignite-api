import { DbTables } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.COMMENT}\`
    ADD INDEX \`idx_comment_entity\` (\`entity_type\`, \`entity_id\`);
    ADD CONSTRAINT \`fk_comment__parent_comment\` 
      FOREIGN KEY (\`parent_comment_id\`) 
      REFERENCES \`${DbTables.COMMENT}\` (\`id\`)
      ON DELETE CASCADE,
    ADD CONSTRAINT \`fk_comment__reply_user_id\` 
      FOREIGN KEY (\`reply_user_id\`) 
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE CASCADE;  
    ADD CONSTRAINT \`fk_comment__user\` 
      FOREIGN KEY (\`user_id\`) 
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE CASCADE;  
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.COMMENT}\
    DROP INDEX \`idx_comment_entity\`,
    DROP FOREIGN KEY \`fk_comment__parent_comment\`,
    DROP FOREIGN KEY \`reply_user_id\`,
    DROP FOREIGN KEY \`fk_comment__user\`;
  `);
}
