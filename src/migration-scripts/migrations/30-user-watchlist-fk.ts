import { DbTables } from '../../config/types';

const FK_USER_WATCHLIST_PREDICTION_SET_ID = 'fk_user_watchlist__prediction_set_id';
const FK_USER_WATCHLIST_USER_ID = 'fk_user_watchlist__user_id';
const IDX_USER_WATCHLIST_PREDICTION_SET_USER = 'idx_user_watchlist__prediction_set_user';
const IDX_USER_WATCHLIST_USER_ID = 'idx_user_watchlist__user_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.USER_WATCHLIST}\`
    ADD UNIQUE INDEX \`${IDX_USER_WATCHLIST_PREDICTION_SET_USER}\` (\`prediction_set_id\`, \`user_id\`) VISIBLE,
    ADD INDEX \`${IDX_USER_WATCHLIST_USER_ID}\` (\`user_id\`) VISIBLE,
    ADD CONSTRAINT \`${FK_USER_WATCHLIST_PREDICTION_SET_ID}\`
      FOREIGN KEY (\`prediction_set_id\`)
      REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_USER_WATCHLIST_USER_ID}\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.USER_WATCHLIST}\` 
      DROP FOREIGN KEY \`${FK_USER_WATCHLIST_PREDICTION_SET_ID}\`,
      DROP FOREIGN KEY \`${FK_USER_WATCHLIST_USER_ID}\`,
      DROP INDEX \`${IDX_USER_WATCHLIST_PREDICTION_SET_USER}\`,
      DROP INDEX \`${IDX_USER_WATCHLIST_USER_ID}\`
  `);
}
