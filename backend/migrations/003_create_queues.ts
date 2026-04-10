import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('queues', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('venue_id').notNullable().references('id').inTable('venues').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table
      .enum('status', ['active', 'paused', 'closed'])
      .notNullable()
      .defaultTo('active');
    table.integer('max_capacity').nullable();
    table.decimal('avg_wait_time_minutes', 8, 2).notNullable().defaultTo(0);
    table.integer('current_position').notNullable().defaultTo(0);
    table.timestamps(true, true);
  });

  await knex.schema.createTable('queue_entries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('queue_id').notNullable().references('id').inTable('queues').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('position').notNullable();
    table
      .enum('status', ['waiting', 'called', 'served', 'cancelled', 'no_show'])
      .notNullable()
      .defaultTo('waiting');
    table.integer('party_size').notNullable().defaultTo(1);
    table.text('notes').nullable();
    table.timestamp('joined_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('called_at').nullable();
    table.timestamp('served_at').nullable();
    table.timestamp('cancelled_at').nullable();
    table.decimal('estimated_wait_minutes', 8, 2).nullable();
  });

  await knex.schema.table('queues', (table) => {
    table.index(['venue_id'], 'idx_queues_venue_id');
    table.index(['status'], 'idx_queues_status');
  });

  await knex.schema.table('queue_entries', (table) => {
    table.index(['queue_id', 'status'], 'idx_queue_entries_queue_status');
    table.index(['user_id'], 'idx_queue_entries_user_id');
    table.index(['queue_id', 'position'], 'idx_queue_entries_position');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('queue_entries');
  await knex.schema.dropTableIfExists('queues');
}
