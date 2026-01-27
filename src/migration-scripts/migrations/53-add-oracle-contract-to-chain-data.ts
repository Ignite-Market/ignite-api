import { DbTables } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_CHAIN_DATA}\`
    ADD COLUMN \`oracleContract\` VARCHAR(42) NULL AFTER \`contractAddress\`
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_CHAIN_DATA}\`
    DROP COLUMN \`oracleContract\`
  `);
};
