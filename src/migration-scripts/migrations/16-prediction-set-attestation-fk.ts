import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID = 'fk_prediction_set_attestation__prediction_set_id';
const FK_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID = 'fk_prediction_set_attestation__data_source_id';

const IDX_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID = 'idx_prediction_set_attestation__prediction_set_id';
const IDX_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID = 'idx_prediction_set_attestation__data_source_id';
const IDX_PREDICTION_SET_ATTESTATION_CREATE_TIME = 'idx_prediction_set_attestation__create_time';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_ATTESTATION}\`
      ADD INDEX \`${IDX_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID}\` (\`prediction_set_id\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID}\` (\`data_source_id\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_ATTESTATION_CREATE_TIME}\` (\`createTime\`) VISIBLE,
      ADD CONSTRAINT \`${FK_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID}\` 
        FOREIGN KEY (\`prediction_set_id\`) 
        REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`),
      ADD CONSTRAINT \`${FK_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID}\`
        FOREIGN KEY (\`data_source_id\`) 
        REFERENCES \`${DbTables.DATA_SOURCE}\` (\`id\`)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_ATTESTATION}\`
      DROP FOREIGN KEY \`${FK_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID}\`,
      DROP FOREIGN KEY \`${FK_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_ATTESTATION_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_ATTESTATION_DATA_SOURCE_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_ATTESTATION_CREATE_TIME}\`
  `);
}
