import { DbTables } from '../../config/types';
import { WorkerLogStatus } from '../../lib/worker/logger';

export const upgrade = async (
  queryFn: (query: string, values?: any[]) => Promise<any[]>
): Promise<void> => {
  await queryFn(`
  CREATE TABLE IF NOT EXISTS \`${DbTables.WORKER_LOG}\` (
    \`id\` INT NOT NULL AUTO_INCREMENT,
    \`ts\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`status\` INT NOT NULL DEFAULT ${WorkerLogStatus.INFO},
    \`worker\` VARCHAR(255) NOT NULL,
    \`type\` VARCHAR(50) NULL,
    \`message\` TEXT NULL,
    \`data\` JSON NULL,
    PRIMARY KEY (\`id\`)
  );
  `);
};

export const downgrade = async (
  queryFn: (query: string, values?: any[]) => Promise<any[]>
): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.WORKER_LOG}\`;
  `);
};
