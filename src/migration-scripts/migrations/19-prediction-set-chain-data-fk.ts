import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID = 'fk_prediction_set_chain_data__prediction_set_id';
const IDX_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID = 'idx_prediction_set_chain_data__prediction_set_id';
const IDX_PREDICTION_SET_CHAIN_DATA_CONDITION_ID = 'idx_prediction_set_chain_data__condition_id';
const IDX_PREDICTION_SET_CHAIN_DATA_CONTRACT_ADDRESS = 'idx_prediction_set_chain_data__contract_address';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_CHAIN_DATA}\`
      ADD INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID}\` (\`prediction_set_id\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_CONDITION_ID}\` (\`conditionId\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_CONTRACT_ADDRESS}\` (\`contractAddress\`) VISIBLE,
      ADD CONSTRAINT \`${FK_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID}\`
        FOREIGN KEY (\`prediction_set_id\`)
        REFERENCES \`${DbTables.PREDICTION_SET}\` (\`id\`)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET_CHAIN_DATA}\` 
      DROP FOREIGN KEY \`${FK_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_PREDICTION_SET_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_CONDITION_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_CHAIN_DATA_CONTRACT_ADDRESS}\`
  `);
}
