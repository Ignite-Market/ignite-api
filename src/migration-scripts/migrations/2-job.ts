import { DbTables } from '../../config/types';
import { JobStatus } from '../../modules/job/job.model';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.JOB}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`name\` VARCHAR(255) NOT NULL,
    \`channel\` INT NOT NULL,
    \`status\` INT NOT NULL DEFAULT ${JobStatus.ACTIVE},
    \`interval\` VARCHAR(255) NOT NULL,
    \`lastRun\` DATETIME NULL,
    \`nextRun\` DATETIME NULL,
    \`timeout\` INT DEFAULT 900,
    \`input\` TEXT NULL,
    \`retries\` INT NULL DEFAULT 0,
    \`lastDuration\` INT NULL,
    \`lastError\` TEXT NULL,
    \`lastCompleted\` DATETIME NULL,
    \`lastFailed\` DATETIME NULL,
    \`parameters\` JSON NULL,
    \`autoRemove\` BOOLEAN DEFAULT FALSE,
    \`executorCount\` INT DEFAULT 0,
    \`createTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`createUser\` INT NULL,
    \`updateTime\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    \`updateUser\` INT NULL,
    PRIMARY KEY (\`id\`))
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.JOB}\`;
  `);
};
