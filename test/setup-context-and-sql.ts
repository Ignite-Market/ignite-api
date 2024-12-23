import { env } from '../src/config/env';
import { Context } from '../src/context';
import { MySql } from '../src/lib/database/mysql';
import { dropTestDatabases } from './migrations';
import { Stage } from './setup';

export async function setupTestContextAndSql(): Promise<Stage> {
  try {
    /********************** API **************************/
    const config = {
      host: env.MYSQL_HOST_TEST,
      database: env.MYSQL_DATABASE_TEST,
      password: env.MYSQL_PASSWORD_TEST,
      port: env.MYSQL_PORT_TEST,
      user: env.MYSQL_USER_TEST,
    };

    const db = new MySql(config);
    await db.connect();
    const context = new Context();
    context.mysql = db;

    return {
      http: undefined,
      app: undefined,
      context,
      db,
    };
  } catch (e) {
    console.error(e);
    throw new Error('Unable to set up test contexts and sqls');
  }
}

/**
 * Releases initialized stage - drops DB, closes SQL connection and closes application.
 *
 * @param stage Stage with connected DB instance and application instance.
 */
export const releaseStage = async (stage: Stage): Promise<void> => {
  if (!stage) {
    throw new Error('Error - stage does not exist');
  }
  if (stage.http) {
    try {
      await stage.http.close();
    } catch (error) {
      throw new Error('Error when closing http server: ' + error);
    }
  }

  if (stage.app) {
    try {
      await stage.app.close();
    } catch (error) {
      throw new Error('Error when closing application: ' + error);
    }
  }

  await dropTestDatabases();
  if (stage.db) {
    try {
      await stage.db.close();
    } catch (error) {
      throw new Error('Error when releasing Access stage: ' + error);
    }
  }
};
