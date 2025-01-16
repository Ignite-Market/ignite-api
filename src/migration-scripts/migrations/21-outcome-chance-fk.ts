import { DbTables } from '../../config/types';

const FK_OUTCOME_CHANCE_OUTCOME_ID = 'fk_outcome_chance__outcome_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.OUTCOME_CHANCE}\`
    ADD CONSTRAINT \`${FK_OUTCOME_CHANCE_OUTCOME_ID}\`
      FOREIGN KEY (\`outcome_id\`)
      REFERENCES \`${DbTables.OUTCOME}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.OUTCOME_CHANCE}\` 
    DROP CONSTRAINT \`${FK_OUTCOME_CHANCE_OUTCOME_ID}\`
  `);
}
