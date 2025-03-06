import { DbTables } from '../../config/types';

const FK_USER_WATCHLIST_PREDICTION_SET_ID = 'fk_user_watchlist__prediction_set_id';
const FK_USER_WATCHLIST_USER_ID = 'fk_user_watchlist__user_id';
const FK_USER_WATCHLIST_UNIQUE_IDX = 'fk_user_watchlist__unique_idx';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.USER_WATCHLIST}\`
    ADD INDEX \`${FK_USER_WATCHLIST_UNIQUE_IDX}\` (\`prediction_set_id\` ASC, \`user_id\` ASC),
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
      DROP INDEX \`${FK_USER_WATCHLIST_UNIQUE_IDX}\`,
      DROP CONSTRAINT \`${FK_USER_WATCHLIST_PREDICTION_SET_ID}\`,
      DROP CONSTRAINT \`${FK_USER_WATCHLIST_USER_ID}\`
  `);
}
