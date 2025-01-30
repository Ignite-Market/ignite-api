import { DbTables } from '../../config/types';

const FK_OUTCOME_VOTING_TRANSACTION_PREDICTION_SET_ID = 'fk_outcome_voting_transaction__prediction_set_id';
const FK_OUTCOME_VOTING_TRANSACTION_OUTCOME_ID = 'fk_outcome_voting_transaction__outcome_id';
const FK_OUTCOME_VOTING_TRANSACTION_USER_ID = 'fk_outcome_voting_transaction__user_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.OUTCOME_VOTING_TRANSACTION}\`
    ADD CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_PREDICTION_SET_ID}\`
      FOREIGN KEY (\`prediction_set_id\`)
      REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_OUTCOME_ID}\`
      FOREIGN KEY (\`outcome_id\`)
      REFERENCES \`${DbTables.OUTCOME}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_USER_ID}\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.OUTCOME_VOTING_TRANSACTION}\` 
      DROP CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_PREDICTION_SET_ID}\`,
      DROP CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_OUTCOME_ID}\`,
      DROP CONSTRAINT \`${FK_OUTCOME_VOTING_TRANSACTION_USER_ID}\`
  `);
}
