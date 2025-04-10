import { DbTables, SqlModelStatus } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.REWARD_POINTS_TRANSACTION}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`user_id\` INT NOT NULL,
    \`reward_points_id\` INT NOT NULL,
    \`value\` INT NOT NULL,
    \`type\` INT NOT NULL,
    \`status\` INT NOT NULL DEFAULT ${SqlModelStatus.ACTIVE},
    \`createUser\` INT NULL,
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  );
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`DROP TABLE IF EXISTS \`${DbTables.REWARD_POINTS_TRANSACTION}\`;`);
}
