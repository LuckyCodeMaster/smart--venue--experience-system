import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('venues', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.text('description').notNullable().defaultTo('');
    table.string('address', 500).notNullable();
    table.integer('capacity').notNullable().defaultTo(0);
    table.string('floor_plan_url', 1000).nullable();
    table.decimal('latitude', 10, 7).notNullable().defaultTo(0);
    table.decimal('longitude', 10, 7).notNullable().defaultTo(0);
    table.jsonb('amenities').notNullable().defaultTo('{}');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });

  await knex.schema.table('venues', (table) => {
    table.index(['is_active'], 'idx_venues_is_active');
    table.index(['name'], 'idx_venues_name');
    table.index(['latitude', 'longitude'], 'idx_venues_geo');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('venues');
}
