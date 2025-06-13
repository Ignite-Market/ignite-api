import { DbTables, SqlModelStatus } from '../../config/types';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PREDICTION_SET_FUNDING_TRANSACTION}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`prediction_set_id\` INT NOT NULL,
    \`user_id\` INT NULL,
    \`txHash\` VARCHAR(66) NULL,
    \`wallet\` VARCHAR(42) NULL,
    \`amounts\` VARCHAR(255) NULL,
    \`shares\` VARCHAR(255) NULL,
    \`collateralAmount\` VARCHAR(255) NULL,
    \`collateralRemovedFromFeePool\` VARCHAR(255) NULL,
    \`type\` INT NULL,
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
    DROP TABLE IF EXISTS \`${DbTables.PREDICTION_SET_FUNDING_TRANSACTION}\`;
  `);
}
