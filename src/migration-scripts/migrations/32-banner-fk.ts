import { DbTables } from '../../config/types';

const FK_BANNER_PREDICTION_SET_ID = 'fk_banner__prediction_set_id';
const IDX_BANNER_PREDICTION_SET_ID = 'idx_banner__prediction_set_id';
const IDX_BANNER_STATUS = 'idx_banner__status';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.BANNER}\`
    ADD INDEX \`${IDX_BANNER_PREDICTION_SET_ID}\` (\`prediction_set_id\`) VISIBLE,
    ADD INDEX \`${IDX_BANNER_STATUS}\` (\`status\`) VISIBLE,
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
      DROP FOREIGN KEY \`${FK_BANNER_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_BANNER_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_BANNER_STATUS}\`
  `);
}
