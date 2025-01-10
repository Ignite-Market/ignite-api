import { DbTables, SqlModelStatus } from '../../config/types';
import { UserEmailStatus } from '../../modules/user/models/user.model';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.USER}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`username\` VARCHAR(200) NULL UNIQUE,
    \`email\` VARCHAR(200) NULL UNIQUE,
    \`emailStatus\` INT NULL DEFAULT '${UserEmailStatus.PENDING}',
    \`walletAddress\` VARCHAR(42) NULL,
    \`referralId\` VARCHAR(36) NULL,
    \`status\` INT NOT NULL DEFAULT '${SqlModelStatus.ACTIVE}',
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`))
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.USER}\`;
  `);
};
