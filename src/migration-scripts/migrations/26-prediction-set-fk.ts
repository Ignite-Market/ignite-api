import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_WINNER_OUTCOME_ID = 'fk_prediction_set__winner_outcome_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
      ADD CONSTRAINT \`${FK_PREDICTION_SET_WINNER_OUTCOME_ID}\` 
        FOREIGN KEY (\`winner_outcome_id\`) 
        REFERENCES \`${DbTables.OUTCOME}\` (\`id\`)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
      DROP FOREIGN KEY \`${FK_PREDICTION_SET_WINNER_OUTCOME_ID}\`
  `);
}
