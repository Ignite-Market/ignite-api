import { DbTables } from '../../config/types';

/**
 * Migration for API Proxy cache table
 * This table stores cached API responses to enable cross-instance request deduplication
 * in the Lambda-based API proxy.
 *
 * Status values:
 * - 1: IN_FLIGHT - Request is being processed
 * - 2: COMPLETED - Request completed, result available
 */
export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    CREATE TABLE IF NOT EXISTS \`${DbTables.API_PROXY_CACHE}\` (
      \`cache_key\` VARCHAR(64) PRIMARY KEY,
      \`status\` INT NOT NULL DEFAULT 1,
      \`response_data\` TEXT NULL,
      \`expires_at\` DATETIME NOT NULL,
      \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`locked_at\` DATETIME NULL,
      \`completed_at\` DATETIME NULL,
      \`lock_token\` CHAR(36) NULL,
      INDEX \`idx_expires_at\` (\`expires_at\`),
      INDEX \`idx_status\` (\`status\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    DROP TABLE IF EXISTS \`${DbTables.API_PROXY_CACHE}\`;
  `);
};
