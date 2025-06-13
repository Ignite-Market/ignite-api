import { DbTables, SqlModelStatus } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.COLLATERAL_TOKEN}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NULL,
    \`symbol\` VARCHAR(255) NOT NULL,
    \`address\` VARCHAR(42) NOT NULL,
    \`decimals\` INT NOT NULL,
    \`fundingThreshold\` VARCHAR(255) NOT NULL,
    \`usdPriceId\` VARCHAR(255) NULL,
    \`usdPrice\` DECIMAL(16, 6) NULL,
    \`imgUrl\` VARCHAR(500) NULL,
    \`requiredVotingAmount\` VARCHAR(255) NULL,
    \`status\` INT NOT NULL DEFAULT ${SqlModelStatus.ACTIVE},
    \`createUser\` INT NULL,
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  );
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`DROP TABLE IF EXISTS \`${DbTables.COLLATERAL_TOKEN}\`;`);
};
