import { DbTables, SqlModelStatus } from '../../config/types';
import { CommentEntityTypes } from '../../modules/comment/models/comment.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${DbTables.COMMENT}\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`entity_id\` INT NOT NULL,
      \`entityType\` INT NOT NULL DEFAULT '${CommentEntityTypes.PREDICTION_SET}',
      \`user_id\` INT NOT NULL,
      \`parent_comment_id\` INT NULL,
      \`reply_user_id\` INT NULL,
      \`content\` TEXT NOT NULL,
      \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
      \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`createUser\` INT NULL,
      \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`updateUser\` INT NULL,
      PRIMARY KEY (\`id\`)
    );
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.COMMENT}\`;
  `);
}
