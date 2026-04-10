import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sensors', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('venue_id').notNullable().references('id').inTable('venues').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table
      .enum('sensor_type', ['occupancy', 'temperature', 'humidity', 'air_quality', 'noise', 'crowd_density'])
      .notNullable();
    table.string('location_description', 500).notNullable();
    table.decimal('latitude', 10, 7).nullable();
    table.decimal('longitude', 10, 7).nullable();
    table.integer('floor_level').nullable();
    table.string('api_key_hash', 255).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_reading_at').nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('sensor_readings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('sensor_id').notNullable().references('id').inTable('sensors').onDelete('CASCADE');
    table.decimal('value', 15, 4).notNullable();
    table.string('unit', 50).notNullable();
    table.jsonb('metadata').nullable();
    table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.table('sensors', (table) => {
    table.index(['venue_id'], 'idx_sensors_venue_id');
    table.index(['sensor_type'], 'idx_sensors_type');
    table.index(['is_active'], 'idx_sensors_is_active');
  });

  await knex.schema.table('sensor_readings', (table) => {
    table.index(['sensor_id', 'recorded_at'], 'idx_sensor_readings_sensor_time');
    table.index(['recorded_at'], 'idx_sensor_readings_time');
  });

  await knex.raw(`
    SELECT create_hypertable('sensor_readings', 'recorded_at', if_not_exists => TRUE)
  `).catch(() => {
    /* TimescaleDB not available – skip hypertable creation */
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sensor_readings');
  await knex.schema.dropTableIfExists('sensors');
}
