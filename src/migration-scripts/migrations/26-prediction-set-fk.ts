import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_WINNER_OUTCOME_ID = 'fk_prediction_set__winner_outcome_id';
const IDX_PREDICTION_SET_SET_STATUS = 'idx_prediction_set__setStatus';
const IDX_PREDICTION_SET_STATUS = 'idx_prediction_set__status';
const IDX_PREDICTION_SET_QUESTION = 'idx_prediction_set__question';
const IDX_PREDICTION_SET_END_TIME = 'idx_prediction_set__endTime';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
      ADD INDEX \`${IDX_PREDICTION_SET_SET_STATUS}\` (\`setStatus\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_STATUS}\` (\`status\`) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_QUESTION}\` (\`question\`(100)) VISIBLE,
      ADD INDEX \`${IDX_PREDICTION_SET_END_TIME}\` (\`endTime\`) VISIBLE,
      ADD CONSTRAINT \`${FK_PREDICTION_SET_WINNER_OUTCOME_ID}\` 
        FOREIGN KEY (\`winner_outcome_id\`) 
        REFERENCES \`${DbTables.OUTCOME}\` (\`id\`)
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
      DROP FOREIGN KEY \`${FK_PREDICTION_SET_WINNER_OUTCOME_ID}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_SET_STATUS}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_STATUS}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_QUESTION}\`,
      DROP INDEX \`${IDX_PREDICTION_SET_END_TIME}\`;
  `);
}
