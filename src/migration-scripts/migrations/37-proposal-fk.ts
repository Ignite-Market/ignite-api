import { DbTables } from '../../config/types';

const FK_PROPOSAL_ROUND_ID = 'fk_proposal__round_id';
const FK_PROPOSAL_USER_ID = 'fk_proposal__user_id';
const IDX_PROPOSAL_ROUND_ID = 'idx_proposal__round_id';
const IDX_PROPOSAL_USER_ID = 'idx_proposal__user_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.PROPOSAL}\`
    ADD INDEX \`${IDX_PROPOSAL_ROUND_ID}\` (\`round_id\`) VISIBLE,
    ADD INDEX \`${IDX_PROPOSAL_USER_ID}\` (\`user_id\`) VISIBLE,
    ADD CONSTRAINT \`${FK_PROPOSAL_ROUND_ID}\`
      FOREIGN KEY (\`round_id\`)
      REFERENCES \`${DbTables.PROPOSAL_ROUND}\` (\`id\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_PROPOSAL_USER_ID}\`
      FOREIGN KEY (\`user_id\`)
        REFERENCES \`${DbTables.USER}\` (\`id\`)
          ON DELETE NO ACTION
          ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL}\` 
      DROP INDEX \`${IDX_PROPOSAL_ROUND_ID}\`,
      DROP INDEX \`${IDX_PROPOSAL_USER_ID}\`,
      DROP CONSTRAINT \`${FK_PROPOSAL_ROUND_ID}\`,
      DROP CONSTRAINT \`${FK_PROPOSAL_USER_ID}\`
  `);
}
