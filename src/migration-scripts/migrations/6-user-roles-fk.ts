import { DbTables } from '../../config/types';

const FK_USER_ROLE_ROLE_ID = 'fk_user_role__role_id';
const FK_USER_ROLE_ROLE_ID_IDX = 'fk_user_role__role_id_idx';
const FK_USER_ROLE_USER_ID = 'fk_user_role__user_id';
const FK_USER_ROLE_USER_ID_IDX = 'fk_user_role__user_id_idx';

export async function upgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
  ALTER TABLE \`${DbTables.USER_ROLE}\`
    ADD INDEX \`${FK_USER_ROLE_ROLE_ID_IDX}\` (\`role_id\` ASC),
    ADD INDEX \`${FK_USER_ROLE_USER_ID_IDX}\` (\`user_id\` ASC),
    ADD CONSTRAINT \`${FK_USER_ROLE_USER_ID}\`
      FOREIGN KEY (\`user_id\`)
      REFERENCES \`${DbTables.USER}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION,
    ADD CONSTRAINT \`${FK_USER_ROLE_ROLE_ID}\`
      FOREIGN KEY (\`role_id\`)
      REFERENCES \`${DbTables.ROLE}\` (\`id\`)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
  `);
}

export async function downgrade(queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> {
  await queryFn(`
    ALTER TABLE \`${DbTables.USER_ROLE}\` 
    DROP INDEX \`${FK_USER_ROLE_ROLE_ID_IDX}\`,
    DROP INDEX \`${FK_USER_ROLE_USER_ID_IDX}\`,
    DROP CONSTRAINT \`${FK_USER_ROLE_USER_ID}\`,
    DROP CONSTRAINT \`${FK_USER_ROLE_ROLE_ID}\`
  `);
}
