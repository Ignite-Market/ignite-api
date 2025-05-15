import { DbTables } from '../../config/types';

const FK_PROPOSAL_ROUND_WINNER_ID = 'fk_proposal_round__winner_id';
const IDX_PROPOSAL_ROUND_WINNER_ID = 'idx_proposal_round__winner_id';
const IDX_PROPOSAL_ROUND_STATUS = 'idx_proposal_round__status';
const IDX_PROPOSAL_ROUND_TIME_STATUS = 'idx_proposal_round__time_status';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL_ROUND}\`
    ADD INDEX \`${IDX_PROPOSAL_ROUND_WINNER_ID}\` (\`winner_id\` ASC) VISIBLE,
    ADD INDEX \`${IDX_PROPOSAL_ROUND_STATUS}\` (\`roundStatus\` ASC, \`status\` ASC) VISIBLE,
    ADD INDEX \`${IDX_PROPOSAL_ROUND_TIME_STATUS}\` (\`endTime\` ASC, \`roundStatus\` ASC, \`status\` ASC) VISIBLE,
    ADD CONSTRAINT \`${FK_PROPOSAL_ROUND_WINNER_ID}\`
      FOREIGN KEY (\`winner_id\`)
      REFERENCES \`${DbTables.PROPOSAL}\` (\`id\`)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT;
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL_ROUND}\`
    DROP FOREIGN KEY \`${FK_PROPOSAL_ROUND_WINNER_ID}\`,
    DROP INDEX \`${IDX_PROPOSAL_ROUND_WINNER_ID}\`,
    DROP INDEX \`${IDX_PROPOSAL_ROUND_STATUS}\`,
    DROP INDEX \`${IDX_PROPOSAL_ROUND_TIME_STATUS}\`;
  `);
};
