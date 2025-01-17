import { DbTables, SqlModelStatus } from '../../config/types';
import { PredictionSetStatus, ResolutionType } from '../../modules/prediction-set/models/prediction-set.model';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.PREDICTION_SET}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`setId\` VARCHAR(255) NOT NULL UNIQUE,
    \`question\` VARCHAR(500) NULL,
    \`description\` TEXT NULL,
    \`generalResolutionDef\` TEXT NULL,
    \`outcomeResolutionDef\` TEXT NULL,
    \`outcomePriceDef\` TEXT NULL,
    \`startTime\` DATETIME NULL,
    \`endTime\` DATETIME NULL,
    \`resolutionTime\` DATETIME NULL,
    \`resolutionType\` INT NOT NULL DEFAULT '${ResolutionType.AUTOMATIC}',
    \`consensusThreshold\` INT NULL,
    \`setStatus\` INT NOT NULL DEFAULT '${PredictionSetStatus.INITIALIZED}',
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
    DROP TABLE IF EXISTS \`${DbTables.PREDICTION_SET}\`;
  `);
}
