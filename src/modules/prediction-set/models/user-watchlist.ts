import { prop } from '@rawmodel/core';
import { integerParser } from '@rawmodel/parsers';
import { DbTables, PopulateFrom, SerializeFor, SqlModelStatus } from '../../../config/types';
import { AdvancedSQLModel } from '../../../lib/base-models/advanced-sql.model';
import { PoolConnection } from 'mysql2/promise';

/**
 * User prediction set watchlist model.
 */
export class UserWatchlist extends AdvancedSQLModel {
  /**
   * Outcome chance's table.
   */
  public tableName = DbTables.USER_WATCHLIST;

  /**
   * User ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public user_id: number;

  /**
   * Prediction set ID.
   */
  @prop({
    parser: { resolver: integerParser() },
    populatable: [PopulateFrom.DB],
    serializable: [SerializeFor.USER, SerializeFor.SELECT_DB, SerializeFor.INSERT_DB]
  })
  public prediction_set_id: number;

  public async populateByUserAndPredictionSetId(userId: number, predictionSetId: number, conn?: PoolConnection): Promise<UserWatchlist> {
    if (!predictionSetId || !userId) {
      return this.reset();
    }
    this.reset();

    const data = await this.getContext().mysql.paramExecute(
      `
        SELECT *
        FROM ${DbTables.USER_WATCHLIST}
        WHERE
          prediction_set_id = @predictionSetId
          AND user_id = @userId
          AND status <> ${SqlModelStatus.DELETED}
        `,
      { predictionSetId, userId },
      conn
    );

    return data?.length ? this.populate(data[0], PopulateFrom.DB) : this.reset();
  }
}
