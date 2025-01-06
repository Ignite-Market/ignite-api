import { DbTables, SqlModelStatus } from '../../config/types';
import { PredictionGroupStatus } from '../../modules/prediction-set/models/prediction-group.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PREDICTION_GROUP}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NULL,
    \`description\` VARCHAR(500) NULL,
    \`groupStatus\` INT NOT NULL DEFAULT '${PredictionGroupStatus.INITIALIZED}',
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
    DROP TABLE IF EXISTS \`${DbTables.PREDICTION_GROUP}\`;
  `);
}
