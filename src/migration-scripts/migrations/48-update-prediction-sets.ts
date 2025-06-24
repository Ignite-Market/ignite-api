import { DbTables } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    ADD COLUMN \`attestationTime\` DATETIME NULL AFTER \`endTime\`,
    DROP COLUMN \`description\`,
    DROP COLUMN \`generalResolutionDef\`,
    DROP COLUMN \`outcomePriceDef\`,
    DROP COLUMN \`setId\`
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    DROP COLUMN \`attestationTime\`,
    ADD COLUMN \`description\` TEXT NOT NULL AFTER \`question\`,
    ADD COLUMN \`generalResolutionDef\` TEXT NOT NULL AFTER \`description\`,
    ADD COLUMN \`outcomePriceDef\` TEXT NOT NULL AFTER \`outcomeResolutionDef\`,
    ADD COLUMN \`setId\` INT NOT NULL AFTER \`collateral_token_id\`
  `);
};
