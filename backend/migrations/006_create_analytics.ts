import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('venue_id')
      .nullable()
      .references('id')
      .inTable('venues')
      .onDelete('SET NULL');
    table
      .uuid('user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('event_type', 100).notNullable();
    table.jsonb('event_data').notNullable().defaultTo('{}');
    table.string('session_id', 255).nullable();
    table.string('ip_address', 50).nullable();
    table.string('user_agent', 500).nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('analytics_events', (table) => {
    table.index(['venue_id'], 'idx_analytics_venue_id');
    table.index(['user_id'], 'idx_analytics_user_id');
    table.index(['event_type'], 'idx_analytics_event_type');
    table.index(['created_at'], 'idx_analytics_created_at');
    table.index(['venue_id', 'event_type', 'created_at'], 'idx_analytics_venue_event_time');
  });

  await knex.raw(`
    SELECT create_hypertable('analytics_events', 'created_at', if_not_exists => TRUE)
  `).catch(() => {
    /* TimescaleDB not available – skip hypertable creation */
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('analytics_events');
}
