import { DbTables, SqlModelStatus } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.CLAIM_TRANSACTION}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`prediction_set_id\` INT NOT NULL,
    \`user_id\` INT NOT NULL,
    \`outcome_id\` INT NOT NULL,
    \`txHash\` VARCHAR(66) NOT NULL,
    \`wallet\` VARCHAR(42) NOT NULL,
    \`amount\` VARCHAR(255) NOT NULL,
    \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`));
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.CLAIM_TRANSACTION}\`;
  `);
};
