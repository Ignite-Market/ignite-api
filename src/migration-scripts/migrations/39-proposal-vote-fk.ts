import { DbTables } from '../../config/types';

const FK_PROPOSAL_VOTE_PROPOSAL_ID = 'fk_proposal_vote__proposal_id';
const FK_PROPOSAL_VOTE_USER_ID = 'fk_proposal_vote__user_id';
const IDX_PROPOSAL_VOTE_PROPOSAL_ID = 'idx_proposal_vote__proposal_id';
const IDX_PROPOSAL_VOTE_USER_ID = 'idx_proposal_vote__user_id';
const IDX_PROPOSAL_VOTE_USER_PROPOSAL = 'idx_proposal_vote__user_proposal';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.PROPOSAL_VOTE}\`
    ADD INDEX \`${IDX_PROPOSAL_VOTE_PROPOSAL_ID}\` (\`proposal_id\`) VISIBLE,
    ADD INDEX \`${IDX_PROPOSAL_VOTE_USER_ID}\` (\`user_id\`) VISIBLE,
    ADD UNIQUE INDEX \`${IDX_PROPOSAL_VOTE_USER_PROPOSAL}\` (\`user_id\`, \`proposal_id\`) VISIBLE,
    ADD CONSTRAINT \`${FK_PROPOSAL_VOTE_PROPOSAL_ID}\`
      FOREIGN KEY (\`proposal_id\`)
      REFERENCES \`${DbTables.PROPOSAL}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_PROPOSAL_VOTE_USER_ID}\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL_VOTE}\` 
      DROP INDEX \`${IDX_PROPOSAL_VOTE_PROPOSAL_ID}\`,
      DROP INDEX \`${IDX_PROPOSAL_VOTE_USER_ID}\`,
      DROP INDEX \`${IDX_PROPOSAL_VOTE_USER_PROPOSAL}\`,
      DROP FOREIGN KEY \`${FK_PROPOSAL_VOTE_PROPOSAL_ID}\`,
      DROP FOREIGN KEY \`${FK_PROPOSAL_VOTE_USER_ID}\`
  `);
}
