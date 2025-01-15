import { Migration, MigrationConnection } from 'ts-mysql-migrate';
import { ConnectionOptions, createPool } from 'mysql2';
import { env } from '../src/config/env';
import { AppEnvironment } from '../src/config/types';

let dbTestMigration: Migration = null;
let dbTestSeed: Migration = null;

export async function setupTestDatabase(): Promise<void> {
  await upgradeTestDatabases();
}

async function initMigrations() {
  if (!dbTestMigration) {
    await initTestMigrations();
  }
}

async function initSeeds() {
  if (!dbTestSeed) {
    await initTestSeed();
  }
}

export async function upgradeTestDatabases(): Promise<void> {
  await initMigrations();
  try {
    await dbTestMigration.up();
  } catch (err) {
    console.error('error at migrations.up()', err);
    throw err;
  }

  await destroyTestMigrations();
}

export async function downgradeTestDatabases(): Promise<void> {
  await initMigrations();
  try {
    await dbTestMigration.down(-1);
  } catch (err) {
    console.error('error at migrations.down()', err);
    throw err;
  }

  await destroyTestMigrations();
}

export async function seedTestDatabases(): Promise<void> {
  await initSeeds();
  try {
    await dbTestSeed.up();
  } catch (err) {
    console.error('error at seeds.up()', err);
    throw err;
  }
  await destroyTestSeeds();
}

export async function unseedTestDatabases(): Promise<void> {
  await initSeeds();
  try {
    await dbTestSeed.down(-1);
  } catch (err) {
    console.error('error at seeds.down()', err);
    throw err;
  }
  await destroyTestSeeds();
}

export async function destroyTestMigrations(): Promise<void> {
  if (dbTestMigration) {
    await dbTestMigration.destroy();
  }
  dbTestMigration = null;
}

export async function destroyTestSeeds(): Promise<void> {
  if (dbTestSeed) {
    await dbTestSeed.destroy();
  }
  dbTestSeed = null;
}

export async function rebuildTestDatabases(): Promise<void> {
  console.info('initMigrations start....');
  await initMigrations();
  console.info('initMigrations success');
  try {
    await dbTestMigration.reset();
  } catch (err) {
    console.error('error at migrations.reset()', err);
    throw err;
  }
  await destroyTestMigrations();
  // await initSeeds();
  // try {
  //   await dbTestSeed.reset();
  // } catch (err) {
  //   console.error('error at seed.reset()', err);
  //   throw err;
  // }
  // await destroyTestSeeds();
}

export async function dropTestDatabases(): Promise<void> {
  await unseedTestDatabases();
  await downgradeTestDatabases();
  await destroyTestMigrations();
  await destroyTestSeeds();
}

async function initTestMigrations() {
  try {
    env.APP_ENV = AppEnvironment.TEST;

    const poolConfig: ConnectionOptions = {
      host: env.MYSQL_HOST_TEST,
      database: env.MYSQL_DATABASE_TEST,
      password: env.MYSQL_PASSWORD_TEST,
      port: env.MYSQL_PORT_TEST,
      user: env.MYSQL_USER_TEST,
      // debug: true,
      connectionLimit: 1
    };

    if (!/(test|testing)/i.test(poolConfig.database)) {
      throw new Error(`!!! ${poolConfig.database} NOT TEST DATABASE? !!!`);
    }

    const pool = createPool(poolConfig);

    dbTestMigration = new Migration({
      conn: pool as unknown as MigrationConnection,
      tableName: 'migrations',
      dir: './src/migration-scripts/migrations',
      silent: env.APP_ENV === AppEnvironment.TEST
    });

    await dbTestMigration.initialize();
  } catch (err) {
    console.error('Error at initTestMigrations', err);
    throw err;
  }
}

async function initTestSeed() {
  try {
    env.APP_ENV = AppEnvironment.TEST;

    const poolConfig: ConnectionOptions = {
      host: env.MYSQL_HOST_TEST,
      database: env.MYSQL_DATABASE_TEST,
      password: env.MYSQL_PASSWORD_TEST,
      port: env.MYSQL_PORT_TEST,
      user: env.MYSQL_USER_TEST,
      // debug: true,
      connectionLimit: 1
    };

    if (!/(test|testing)/i.test(poolConfig.database)) {
      throw new Error(`!!! ${poolConfig.database} NOT TEST DATABASE? !!!`);
    }

    const pool = createPool(poolConfig);

    dbTestSeed = new Migration({
      conn: pool as unknown as MigrationConnection,
      tableName: 'seeds',
      dir: './src/migration-scripts/seeds',
      silent: env.APP_ENV === AppEnvironment.TEST
    });

    await dbTestSeed.initialize();
  } catch (err) {
    console.error('Error at initTestSeed', err);
    throw err;
  }
}
