import { DbTables } from '../../config/types';

const FK_PROPOSAL_ROUND_ID = 'fk_proposal__round_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.PROPOSAL}\`
    ADD CONSTRAINT \`${FK_PROPOSAL_ROUND_ID}\`
      FOREIGN KEY (\`round_id\`)
      REFERENCES \`${DbTables.PROPOSAL_ROUND}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PROPOSAL}\` 
      DROP CONSTRAINT \`${FK_PROPOSAL_ROUND_ID}\`
  `);
}
