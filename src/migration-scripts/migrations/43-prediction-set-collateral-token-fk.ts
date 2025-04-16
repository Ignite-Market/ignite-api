import { DbTables } from '../../config/types';

const FK_PREDICTION_SET_COLLATERAL_TOKEN_ID = 'fk_prediction_set__collateral_token_id';
const FK_PREDICTION_SET_COLLATERAL_TOKEN_ID_IDX = 'fk_prediction_set__collateral_token_id_idx';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    ADD COLUMN \`collateral_token_id\` INT NOT NULL AFTER \`winner_outcome_id\`;
  `);

  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    ADD INDEX \`${FK_PREDICTION_SET_COLLATERAL_TOKEN_ID_IDX}\` (\`collateral_token_id\` ASC) VISIBLE,
    ADD CONSTRAINT \`${FK_PREDICTION_SET_COLLATERAL_TOKEN_ID}\`
      FOREIGN KEY (\`collateral_token_id\`)
      REFERENCES \`${DbTables.COLLATERAL_TOKEN}\` (\`id\`)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT;
  `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    DROP FOREIGN KEY \`${FK_PREDICTION_SET_COLLATERAL_TOKEN_ID}\`;
  `);

  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    DROP INDEX \`${FK_PREDICTION_SET_COLLATERAL_TOKEN_ID_IDX}\`;
  `);

  await queryFn(`
    ALTER TABLE \`${DbTables.PREDICTION_SET}\`
    DROP COLUMN \`collateral_token_id\`;
  `);
};
