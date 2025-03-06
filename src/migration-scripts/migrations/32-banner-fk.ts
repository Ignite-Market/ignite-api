import { DbTables } from '../../config/types';

const FK_BANNER_PREDICTION_SET_ID = 'fk_banner__prediction_set_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.BANNER}\`
    ADD CONSTRAINT \`${FK_BANNER_PREDICTION_SET_ID}\`
      FOREIGN KEY (\`prediction_set_id\`)
      REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.BANNER}\` 
      DROP CONSTRAINT \`${FK_BANNER_PREDICTION_SET_ID}\`
  `);
}
