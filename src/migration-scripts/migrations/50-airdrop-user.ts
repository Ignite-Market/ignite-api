import { DbTables, SqlModelStatus } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.AIRDROP_USER}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`walletAddress\` VARCHAR(42) NOT NULL UNIQUE,
    \`email\` VARCHAR(200) NOT NULL UNIQUE,
    \`twitter\` VARCHAR(200) NULL,
    \`discord\` VARCHAR(200) NULL,
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
    DROP TABLE IF EXISTS \`${DbTables.AIRDROP_USER}\`;
  `);
};
