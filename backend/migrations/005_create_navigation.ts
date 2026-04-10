import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('navigation_zones', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('venue_id').notNullable().references('id').inTable('venues').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.string('zone_type', 100).notNullable().defaultTo('general');
    table.integer('floor_level').notNullable().defaultTo(0);
    table.jsonb('coordinates').notNullable().defaultTo('{"type":"Polygon","coordinates":[]}');
    table.integer('capacity').nullable();
    table.string('amenity_type', 100).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('navigation_routes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('venue_id').notNullable().references('id').inTable('venues').onDelete('CASCADE');
    table
      .uuid('from_zone_id')
      .notNullable()
      .references('id')
      .inTable('navigation_zones')
      .onDelete('CASCADE');
    table
      .uuid('to_zone_id')
      .notNullable()
      .references('id')
      .inTable('navigation_zones')
      .onDelete('CASCADE');
    table.decimal('distance_meters', 10, 2).notNullable().defaultTo(0);
    table.integer('estimated_walk_seconds').notNullable().defaultTo(0);
    table.boolean('accessibility_friendly').notNullable().defaultTo(true);
    table.jsonb('waypoints').notNullable().defaultTo('[]');
    table.timestamps(true, true);
  });

  await knex.schema.table('navigation_zones', (table) => {
    table.index(['venue_id'], 'idx_nav_zones_venue_id');
    table.index(['venue_id', 'floor_level'], 'idx_nav_zones_floor');
    table.index(['amenity_type'], 'idx_nav_zones_amenity');
  });

  await knex.schema.table('navigation_routes', (table) => {
    table.index(['venue_id'], 'idx_nav_routes_venue_id');
    table.index(['from_zone_id'], 'idx_nav_routes_from');
    table.index(['to_zone_id'], 'idx_nav_routes_to');
    table.index(['accessibility_friendly'], 'idx_nav_routes_accessible');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('navigation_routes');
  await knex.schema.dropTableIfExists('navigation_zones');
}
