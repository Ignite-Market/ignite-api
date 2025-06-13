import { DbTables, SqlModelStatus } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.DATA_SOURCE}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`endpoint\` VARCHAR(255) NOT NULL,
    \`jqQuery\` VARCHAR(500) NOT NULL,
    \`abi\` JSON NOT NULL,
    \`httpMethod\` VARCHAR(16) NULL,
    \`body\` JSON NULL,
    \`headers\` JSON NULL,
    \`queryParams\` JSON NULL,
    \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`));
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.DATA_SOURCE}\`;
  `);
}
