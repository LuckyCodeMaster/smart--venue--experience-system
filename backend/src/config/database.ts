import knex, { Knex } from 'knex';
import { env } from './env';

const getKnexConfig = (): Knex.Config => {
  const baseConfig: Knex.Config = {
    client: 'pg',
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000,
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './seeds',
    },
  };

  if (env.DATABASE_URL) {
    return {
      ...baseConfig,
      connection: {
        connectionString: env.DATABASE_URL,
        ssl: env.isProduction() ? { rejectUnauthorized: false } : false,
      },
    };
  }

  return {
    ...baseConfig,
    connection: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    },
  };
};

const db = knex(getKnexConfig());

export const testConnection = async (): Promise<void> => {
  await db.raw('SELECT 1');
};

export default db;
