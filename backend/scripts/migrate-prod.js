#!/usr/bin/env node
'use strict';

/**
 * Production migration runner.
 * Used inside the Docker production image where migrations are pre-compiled to JS.
 * Run with: npm run migrate:prod
 */

const knex = require('knex');
const config = require('../knexfile');

async function run() {
  const db = knex(config.production);
  try {
    const [batchNo, migrations] = await db.migrate.latest();
    if (migrations.length === 0) {
      console.log('Already up to date.');
    } else {
      console.log(`Batch ${batchNo} run: ${migrations.length} migration(s)`);
      migrations.forEach((m) => console.log(' -', m));
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
