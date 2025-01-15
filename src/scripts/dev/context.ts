import { env, getEnvSecrets } from '../../config/env';
import { AppEnvironment } from '../../config/types';
import { Context } from '../../context';
import { MySql } from '../../lib/database/mysql';

/**
 * Creates context with MySQL connection.
 */
export async function createContext(): Promise<Context> {
  await getEnvSecrets();

  const options = {
    host: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_HOST_TEST : env.MYSQL_HOST,
    port: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PORT_TEST : env.MYSQL_PORT,
    database: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_DATABASE_TEST : env.MYSQL_DATABASE,
    user: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_USER_TEST : env.MYSQL_USER,
    password: env.APP_ENV === AppEnvironment.TEST ? env.MYSQL_PASSWORD_TEST : env.MYSQL_PASSWORD
  };

  const mysql = new MySql(options);
  await mysql.connect();
  const context = new Context();
  context.setMySql(mysql);

  return context;
}
