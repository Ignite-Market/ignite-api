import { env, getEnvSecrets } from '../../config/env';
import { SqlMigrator } from '../../lib/database/sql-migrator';

async function run() {
  await getEnvSecrets();

  const migrator = new SqlMigrator({
    database: env.MYSQL_DATABASE_TEST,
    host: env.MYSQL_HOST_TEST,
    port: env.MYSQL_PORT_TEST,
    user: env.MYSQL_USER_TEST,
    password: env.MYSQL_PASSWORD_TEST,
  });

  await migrator.rebuild(false);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
