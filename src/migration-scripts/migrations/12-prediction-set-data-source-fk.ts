import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_ID = 'fk_prediction_set_data_source__prediction_set_id';
const FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_IDX = 'fk_prediction_set_data_source__prediction_set_id_idx';
const FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID = 'fk_prediction_set_data_source__data_source_id';
const FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID_IDX = 'fk_prediction_set_data_source__data_source_id_idx';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.PREDICTION_SET_DATA_SOURCE}\`
    ADD INDEX \`${FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_IDX}\` (\`prediction_set_id\` ASC),
    ADD INDEX \`${FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID_IDX}\` (\`data_source_id\` ASC),
    ADD CONSTRAINT \`${FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID}\`
      FOREIGN KEY (\`data_source_id\`)
      REFERENCES \`${DbTables.DATA_SOURCE}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_ID}\`
      FOREIGN KEY (\`prediction_set_id\`)
      REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_DATA_SOURCE}\` 
    DROP INDEX \`${FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_IDX}\`,
    DROP INDEX \`${FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID_IDX}\`,
    DROP CONSTRAINT \`${FK_PREDICTION_SET_DATA_SOURCE_DATA_SOURCE_ID}\`,
    DROP CONSTRAINT \`${FK_PREDICTION_SET_DATA_SOURCE_PREDICTION_SET_ID}\`
  `);
}
