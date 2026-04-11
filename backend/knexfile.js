'use strict';

require('dotenv').config();

// Register ts-node so knex CLI can load TypeScript migration files in dev/test
if (process.env.NODE_ENV !== 'production') {
  require('ts-node').register({ transpileOnly: true });
}

const base = {
  client: 'pg',
  pool: { min: 2, max: 10 },
};

/** @type {Record<string, import('knex').Knex.Config>} */
module.exports = {
  development: {
    ...base,
    connection: process.env.DATABASE_URL || {
      host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || process.env.DB_PORT || '5432', 10),
      database: process.env.PG_DATABASE || process.env.DB_NAME || 'sves_db',
      user: process.env.PG_USER || process.env.DB_USER || 'postgres',
      password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || '',
    },
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
  },

  test: {
    ...base,
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      extension: 'ts',
      tableName: 'knex_migrations',
    },
  },

  production: {
    ...base,
    connection: {
      connectionString: process.env.DATABASE_URL,
      // Enable SSL only when PG_SSL=true.
      // Set PG_SSL_REJECT_UNAUTHORIZED=false only if using self-signed certs;
      // defaults to true (certificate verification enabled).
      ssl: process.env.PG_SSL === 'true'
        ? { rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
    },
    migrations: {
      // Migrations are pre-compiled to JS during the Docker build
      directory: './dist/migrations',
      extension: 'js',
      tableName: 'knex_migrations',
    },
  },
};
