import { env, getEnvSecrets } from '../../config/env';
import { SqlMigrator } from '../../lib/database/sql-migrator';

async function run() {
  await getEnvSecrets();

  const migrator = new SqlMigrator({
    database: env.MYSQL_DATABASE,
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
  });

  const showDialog = !process.argv.includes('--F');
  await migrator.seed(showDialog);
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
