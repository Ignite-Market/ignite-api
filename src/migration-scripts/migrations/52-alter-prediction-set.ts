import { DbTables } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    ADD COLUMN \`hide\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`imgUrl\`,
    ADD COLUMN \`marketCapPercent\` INT NOT NULL DEFAULT 10 AFTER \`hide\`
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    DROP COLUMN \`marketCapPercent\`,
    DROP COLUMN \`hide\`
  `);
};
