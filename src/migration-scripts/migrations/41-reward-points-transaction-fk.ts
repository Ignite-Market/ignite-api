import { DbTables } from '../../config/types';

const FK_REWARD_POINTS_TRANSACTION_USER_ID = 'fk_reward_points_transaction__user_id';
const FK_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID = 'fk_reward_points_transaction__reward_points_id';
const IDX_REWARD_POINTS_TRANSACTION_USER_ID = 'idx_reward_points_transaction__user_id';
const IDX_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID = 'idx_reward_points_transaction__reward_points_id';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.REWARD_POINTS_TRANSACTION}\`
      ADD INDEX \`${IDX_REWARD_POINTS_TRANSACTION_USER_ID}\` (\`user_id\` ASC) VISIBLE,
      ADD INDEX \`${IDX_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID}\` (\`reward_points_id\` ASC) VISIBLE,
      ADD CONSTRAINT \`${FK_REWARD_POINTS_TRANSACTION_USER_ID}\`
        FOREIGN KEY (\`user_id\`)
        REFERENCES \`${DbTables.USER}\` (\`id\`)
        ON DELETE NO ACTION
        ON DELETE NO ACTION,
      ADD CONSTRAINT \`${FK_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID}\`
        FOREIGN KEY (\`reward_points_id\`)
        REFERENCES \`${DbTables.REWARD_POINTS}\` (\`id\`)
        ON DELETE NO ACTION
        ON DELETE NO ACTION;
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.REWARD_POINTS_TRANSACTION}\`
      DROP FOREIGN KEY \`${FK_REWARD_POINTS_TRANSACTION_USER_ID}\`,
      DROP FOREIGN KEY \`${FK_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID}\`,
      DROP INDEX \`${IDX_REWARD_POINTS_TRANSACTION_USER_ID}\`,
      DROP INDEX \`${IDX_REWARD_POINTS_TRANSACTION_REWARD_POINTS_ID}\`;
  `);
}
