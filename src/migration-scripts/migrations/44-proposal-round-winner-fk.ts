import { DbTables } from '../../config/types';

const FK_PROPOSAL_ROUND_WINNER_ID = 'fk_proposal_round__winner_id';
const FK_PROPOSAL_ROUND_WINNER_ID_IDX = 'fk_proposal_round__winner_id_idx';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL_ROUND}\`
    ADD INDEX \`${FK_PROPOSAL_ROUND_WINNER_ID_IDX}\` (\`winner_id\` ASC) VISIBLE,
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
    DROP INDEX \`${FK_PROPOSAL_ROUND_WINNER_ID_IDX}\`;
  `);
};
