import { DbTables } from '../../config/types';

const FK_COMMENT_PARENT_COMMENT_ID = 'fk_comment__parent_comment_id';
const FK_COMMENT_REPLY_USER_ID = 'fk_comment__reply_user_id';
const FK_COMMENT_USER_ID = 'fk_comment__user_id';

const IDX_COMMENT_ENTITY_ID = 'idx_comment__entity_id';
const IDX_COMMENT_ENTITY_TYPE = 'idx_comment__entity_type';
const IDX_COMMENT_ENTITY_COMBINED = 'idx_comment__entity_combined';
const IDX_COMMENT_USER_ID = 'idx_comment__user_id';
const IDX_COMMENT_REPLY_USER_ID = 'idx_comment__reply_user_id';
const IDX_COMMENT_PARENT_COMMENT_ID = 'idx_comment__parent_comment_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.COMMENT}\`
      ADD INDEX \`${IDX_COMMENT_ENTITY_ID}\` (\`entity_id\`) VISIBLE,
      ADD INDEX \`${IDX_COMMENT_ENTITY_TYPE}\` (\`entityType\`) VISIBLE,
      ADD INDEX \`${IDX_COMMENT_ENTITY_COMBINED}\` (\`entity_id\`, \`entityType\`) VISIBLE,
      ADD INDEX \`${IDX_COMMENT_USER_ID}\` (\`user_id\`) VISIBLE,
      ADD INDEX \`${IDX_COMMENT_REPLY_USER_ID}\` (\`reply_user_id\`) VISIBLE,
      ADD INDEX \`${IDX_COMMENT_PARENT_COMMENT_ID}\` (\`parent_comment_id\`) VISIBLE,
      ADD CONSTRAINT \`${FK_COMMENT_PARENT_COMMENT_ID}\` 
        FOREIGN KEY (\`parent_comment_id\`) 
        REFERENCES \`${DbTables.COMMENT}\` (\`id\`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION,
      ADD CONSTRAINT \`${FK_COMMENT_REPLY_USER_ID}\` 
        FOREIGN KEY (\`reply_user_id\`) 
        REFERENCES \`${DbTables.USER}\` (\`id\`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION,
      ADD CONSTRAINT \`${FK_COMMENT_USER_ID}\` 
        FOREIGN KEY (\`user_id\`) 
        REFERENCES \`${DbTables.USER}\` (\`id\`)
        ON DELETE CASCADE
        ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.COMMENT}\`
      DROP FOREIGN KEY \`${FK_COMMENT_PARENT_COMMENT_ID}\`,
      DROP FOREIGN KEY \`${FK_COMMENT_REPLY_USER_ID}\`,
      DROP FOREIGN KEY \`${FK_COMMENT_USER_ID}\`,
      DROP INDEX \`${IDX_COMMENT_ENTITY_ID}\`,
      DROP INDEX \`${IDX_COMMENT_ENTITY_TYPE}\`,
      DROP INDEX \`${IDX_COMMENT_ENTITY_COMBINED}\`,
      DROP INDEX \`${IDX_COMMENT_USER_ID}\`,
      DROP INDEX \`${IDX_COMMENT_REPLY_USER_ID}\`,
      DROP INDEX \`${IDX_COMMENT_PARENT_COMMENT_ID}\`;
  `);
}
