import { DbTables } from '../../config/types';

const FK_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID = 'fk_outcome_share_transaction__prediction_set_id';
const FK_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID = 'fk_outcome_share_transaction__outcome_id';
const FK_OUTCOME_SHARE_TRANSACTION_USER_ID = 'fk_outcome_share_transaction__user_id';

const IDX_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID = 'idx_outcome_share_transaction__prediction_set_id';
const IDX_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID = 'idx_outcome_share_transaction__outcome_id';
const IDX_OUTCOME_SHARE_TRANSACTION_USER_ID = 'idx_outcome_share_transaction__user_id';
const IDX_OUTCOME_SHARE_TRANSACTION_TYPE = 'idx_outcome_share_transaction__type';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.OUTCOME_SHARE_TRANSACTION}\`
      ADD INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID}\` (\`prediction_set_id\`) VISIBLE,
      ADD INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID}\` (\`outcome_id\`) VISIBLE,
      ADD INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_USER_ID}\` (\`user_id\`) VISIBLE,
      ADD INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_TYPE}\` (\`type\`) VISIBLE,
      ADD CONSTRAINT \`${FK_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID}\`
        FOREIGN KEY (\`prediction_set_id\`)
        REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      ADD CONSTRAINT \`${FK_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID}\`
        FOREIGN KEY (\`outcome_id\`)
        REFERENCES \`${DbTables.OUTCOME}\` (\`id\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      ADD CONSTRAINT \`${FK_OUTCOME_SHARE_TRANSACTION_USER_ID}\`
        FOREIGN KEY (\`user_id\`)
        REFERENCES \`${DbTables.USER}\` (\`id\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.OUTCOME_SHARE_TRANSACTION}\`
      DROP FOREIGN KEY \`${FK_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID}\`,
      DROP FOREIGN KEY \`${FK_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID}\`,
      DROP FOREIGN KEY \`${FK_OUTCOME_SHARE_TRANSACTION_USER_ID}\`,
      DROP INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_OUTCOME_ID}\`,
      DROP INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_USER_ID}\`,
      DROP INDEX \`${IDX_OUTCOME_SHARE_TRANSACTION_TYPE}\`;
  `);
}
