import { DbTables, DefaultUserRole } from '../../src/config/types';
import { Context } from '../../src/context';
import { Role } from '../../src/modules/user/models/role.model';

/**
 * Creates base application roles.
 * @param context Application context.
 */
export async function createBaseRoles(context: Context) {
  await context.mysql.paramExecute(`
    INSERT INTO \`${DbTables.ROLE}\` (
      \`id\`,
      \`name\`
    )
    VALUES
      (${DefaultUserRole.ADMIN}, '${DefaultUserRole[DefaultUserRole.ADMIN]}'),
      (${DefaultUserRole.USER}, '${DefaultUserRole[DefaultUserRole.USER]}')
  `);

  const adminRole = await new Role({}, context).populateById(DefaultUserRole.ADMIN);
  const userRole = await new Role({}, context).populateById(DefaultUserRole.USER);

  if (adminRole.id !== DefaultUserRole.ADMIN || userRole.id !== DefaultUserRole.USER) {
    throw new Error('Bad role creation, ids are not as expected (1,2,3)');
  }
}
