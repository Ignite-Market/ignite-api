import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_PREDICTION_GROUP_ID = 'fk_prediction_set__prediction_group_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    ADD CONSTRAINT \`${FK_PREDICTION_SET_PREDICTION_GROUP_ID}\`
      FOREIGN KEY (\`prediction_group_id\`)
      REFERENCES \`${DbTables.PREDICTION_GROUP}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\` 
    DROP CONSTRAINT \`${FK_PREDICTION_SET_PREDICTION_GROUP_ID}\`
  `);
}
