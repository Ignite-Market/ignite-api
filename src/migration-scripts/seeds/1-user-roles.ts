import { DbTables, DefaultUserRole } from '../../config/types';

export const upgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`
      INSERT INTO \`${DbTables.ROLE}\` (
        \`id\`,
        \`name\`
      )
      VALUES
        (${DefaultUserRole.ADMIN}, '${DefaultUserRole[DefaultUserRole.ADMIN]}'),
        (${DefaultUserRole.USER}, '${DefaultUserRole[DefaultUserRole.USER]}')
    `);
};

export const downgrade = async (queryFn: (query: string, values?: any[]) => Promise<any[]>): Promise<void> => {
  await queryFn(`DELETE FROM \`${DbTables.ROLE}\``);
};
