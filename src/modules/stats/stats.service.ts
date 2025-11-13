import { Injectable } from '@nestjs/common';
import { Context } from '../../context';
import { DbTables, SqlModelStatus, TimeRange } from '../../config/types';
import { getQueryParams, selectAndCountQuery } from '../../lib/database/sql-utils';
import { TopUsersQueryFilter } from './dtos/top-users-query-filter';
import { ShareTransactionType } from '../prediction-set/models/transactions/outcome-share-transaction.model';
import { FundingTransactionType } from '../prediction-set/models/transactions/prediction-set-funding-transaction.model';

@Injectable()
export class StatsService {
  /**
   * Returns top users based on the sum of profit from claim transactions.
   *
   * @param query Query filter to apply.
   * @param context Application context.
   * @returns List of top users with their total profit amounts.
   */
  async getTopUsersByProfit(query: TopUsersQueryFilter, context: Context): Promise<any> {
    // Set default parameters
    const defaultParams = {
      range: TimeRange.ALL
    };

    // Define field mappings for ordering
    const fieldMap = {
      id: 'u.id',
      username: 'u.username',
      walletAddress: 'u.walletAddress',
      totalProfit: 'SUM(ct.amount)'
    };

    // Get params and filters from the query
    const { params, filters } = getQueryParams(defaultParams, 'u', fieldMap, query.serialize());

    // Build time range filter
    let timeRangeFilter = '';
    if (params.range !== TimeRange.ALL) {
      let interval: string = null;
      switch (params.range) {
        case TimeRange.ONE_DAY:
          interval = 'DAY';
          break;
        case TimeRange.ONE_WEEK:
          interval = 'WEEK';
          break;
        case TimeRange.ONE_MONTH:
          interval = 'MONTH';
          break;
        default:
          interval = null;
      }

      if (interval) {
        timeRangeFilter = `AND ct.createTime >= DATE_SUB(NOW(), INTERVAL 1 ${interval})`;
      }
    }

    const sqlQuery = {
      qSelect: `
        SELECT 
          u.id,
          u.username,
          u.walletAddress,
          SUM(ct.amount) AS totalProfit,
          p.collateral_token_id
      `,
      qFrom: `
        FROM ${DbTables.CLAIM_TRANSACTION} ct
        JOIN ${DbTables.USER} u
          ON u.id = ct.user_id
        JOIN ${DbTables.PREDICTION_SET} p
          ON p.id = ct.prediction_set_id
        WHERE ct.status <> ${SqlModelStatus.DELETED}
          AND u.status <> ${SqlModelStatus.DELETED}
          AND p.collateral_token_id = @collateralTokenId
          ${timeRangeFilter}
      `,
      qGroup: `
        GROUP BY u.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr || 'totalProfit DESC'}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(context.mysql, sqlQuery, params, 'u.id');
  }

  /**
   * Returns top users based on their trading volume (buy transactions + funding transactions).
   *
   * @param query Query filter to apply.
   * @param context Application context.
   * @returns List of top users with their total trading volume.
   */
  async getTopUsersByVolume(query: TopUsersQueryFilter, context: Context): Promise<any> {
    // Set default parameters
    const defaultParams = {
      range: TimeRange.ALL
    };

    // Define field mappings for ordering
    const fieldMap = {
      id: 'u.id',
      username: 'u.username',
      walletAddress: 'u.walletAddress',
      totalVolume: 'totalVolume'
    };

    // Get params and filters from the query
    const { params, filters } = getQueryParams(defaultParams, 'u', fieldMap, query.serialize());

    // Build time range filter condition
    let timeRangeCondition = '';
    if (params.range !== TimeRange.ALL) {
      let interval: string = null;
      switch (params.range) {
        case TimeRange.ONE_DAY:
          interval = 'DAY';
          break;
        case TimeRange.ONE_WEEK:
          interval = 'WEEK';
          break;
        case TimeRange.ONE_MONTH:
          interval = 'MONTH';
          break;
        default:
          interval = null;
      }

      if (interval) {
        timeRangeCondition = `AND tx_time >= DATE_SUB(NOW(), INTERVAL 1 ${interval})`;
      }
    }

    const sqlQuery = {
      qSelect: `
        SELECT 
          u.id,
          u.username,
          u.walletAddress,
          SUM(volume_amount) AS totalVolume,
          p.collateral_token_id
      `,
      qFrom: `
        FROM ${DbTables.USER} u
        JOIN (
          SELECT 
            user_id, 
            amount AS volume_amount,
            createTime AS tx_time,
            prediction_set_id
          FROM ${DbTables.OUTCOME_SHARE_TRANSACTION}
          WHERE status <> ${SqlModelStatus.DELETED}
            AND type = ${ShareTransactionType.BUY}
          
          UNION ALL
          
          SELECT 
            user_id, 
            collateralAmount AS volume_amount,
            createTime AS tx_time,
            prediction_set_id
          FROM ${DbTables.PREDICTION_SET_FUNDING_TRANSACTION}
          WHERE status <> ${SqlModelStatus.DELETED}
            AND collateralAmount IS NOT NULL
            AND type = ${FundingTransactionType.ADDED}
        ) AS combined_txs ON combined_txs.user_id = u.id
        
        JOIN ${DbTables.PREDICTION_SET} p
          ON p.id = combined_txs.prediction_set_id
        
        WHERE u.status <> ${SqlModelStatus.DELETED}
          AND p.collateral_token_id = @collateralTokenId
          ${timeRangeCondition}
      `,
      qGroup: `
        GROUP BY u.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr || 'totalVolume DESC'}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(context.mysql, sqlQuery, params, 'u.id');
  }

  /**
   * Returns top users based on the sum of reward points from reward points transactions.
   *
   * @param query Query filter to apply.
   * @param context Application context.
   * @returns List of top users with their total reward points.
   */
  async getTopUsersByRewardPoints(query: TopUsersQueryFilter, context: Context): Promise<any> {
    // Set default parameters
    const defaultParams = {
      range: TimeRange.ALL
    };

    // Define field mappings for ordering
    const fieldMap = {
      id: 'u.id',
      username: 'u.username',
      walletAddress: 'u.walletAddress',
      totalRewardPoints: 'SUM(rpt.value)'
    };

    // Get params and filters from the query
    const { params, filters } = getQueryParams(defaultParams, 'u', fieldMap, query.serialize());

    // Build time range filter
    let timeRangeFilter = '';
    if (params.range !== TimeRange.ALL) {
      let interval: string = null;
      switch (params.range) {
        case TimeRange.ONE_DAY:
          interval = 'DAY';
          break;
        case TimeRange.ONE_WEEK:
          interval = 'WEEK';
          break;
        case TimeRange.ONE_MONTH:
          interval = 'MONTH';
          break;
        default:
          interval = null;
      }

      if (interval) {
        timeRangeFilter = `AND rpt.createTime >= DATE_SUB(NOW(), INTERVAL 1 ${interval})`;
      }
    }

    const sqlQuery = {
      qSelect: `
        SELECT 
          u.id,
          u.username,
          u.walletAddress,
          SUM(rpt.value) AS totalRewardPoints
      `,
      qFrom: `
        FROM ${DbTables.REWARD_POINTS_TRANSACTION} rpt
        JOIN ${DbTables.USER} u
          ON u.id = rpt.user_id
        WHERE rpt.status <> ${SqlModelStatus.DELETED}
          AND u.status <> ${SqlModelStatus.DELETED}
          ${timeRangeFilter}
      `,
      qGroup: `
        GROUP BY u.id
      `,
      qFilter: `
        ORDER BY ${filters.orderStr || 'totalRewardPoints DESC'}
        LIMIT ${filters.limit} OFFSET ${filters.offset};
      `
    };

    return await selectAndCountQuery(context.mysql, sqlQuery, params, 'u.id');
  }
}
