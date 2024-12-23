import { prop } from '@rawmodel/core';
import { stringParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';

/**
 * Role model.
 */
export class Role extends AdvancedSQLModel {
  /**
   * Roles table.
   */
  tableName = DbTables.ROLES;

  /**
   * Role's name property definition.
   */
  @prop({
    parser: { resolver: stringParser() },
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB],
    populatable: [PopulateFrom.DB]
  })
  public name: string;
}
