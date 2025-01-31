import { DbTables, SqlModelStatus } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.OUTCOME}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`prediction_set_id\` INT NOT NULL,
    \`name\` VARCHAR(255) NULL,
    \`outcomeIndex\` INT NOT NULL,
    \`positionId\` VARCHAR(255) NULL,
    \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`unique_outcome_index_prediction_set_id\` (\`outcomeIndex\`, \`prediction_set_id\`)
  );
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.OUTCOME}\`;
  `);
}
