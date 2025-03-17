import fp from 'fastify-plugin';
import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database setup function
async function setupDatabase(fastify, options) {
    const db = knex({
        client: 'sqlite3',
        connection: {
            filename: join(__dirname, '../db/transcendence.sqlite')
        },
        useNullAsDefault: true
    });

    // Test the connection
    try {
        await db.raw('SELECT 1');
        fastify.log.info('Database connected successfully');
    } catch (err) {
        fastify.log.error('Database connection failed:', err);
        throw err;
    }

    // Initialize database schema
    await initializeDatabase(db);

    // Make the database connection available through fastify
    fastify.decorate('db', db);
}

async function initializeDatabase(db) {
    // Users table
    if (!await db.schema.hasTable('users')) {
        await db.schema.createTable('users', table => {
            table.increments('id').primary();
            table.string('username').unique().notNullable();
            table.string('display_name');
            table.string('email').unique();
            table.string('password_hash');
            table.string('avatar_url');
            table.integer('wins').defaultTo(0);
            table.integer('losses').defaultTo(0);
            table.timestamps(true, true);
        });
    }

    // Games table
    if (!await db.schema.hasTable('games')) {
        await db.schema.createTable('games', table => {
            table.increments('id').primary();
            table.integer('player1_id').references('id').inTable('users');
            table.integer('player2_id').references('id').inTable('users');
            table.integer('winner_id').references('id').inTable('users');
            table.integer('player1_score').defaultTo(0);
            table.integer('player2_score').defaultTo(0);
            table.string('game_type').notNullable(); // 'single' or 'multi'
            table.string('status').defaultTo('pending'); // 'pending', 'active', 'completed'
            table.timestamps(true, true);
        });
    }

    // Tournaments table
    if (!await db.schema.hasTable('tournaments')) {
        await db.schema.createTable('tournaments', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
            table.string('status').defaultTo('pending'); // 'pending', 'active', 'completed'
            table.integer('winner_id').references('id').inTable('users');
            table.timestamps(true, true);
        });
    }

    // Tournament Participants table
    if (!await db.schema.hasTable('tournament_participants')) {
        await db.schema.createTable('tournament_participants', table => {
            table.increments('id').primary();
            table.integer('tournament_id').references('id').inTable('tournaments');
            table.integer('user_id').references('id').inTable('users');
            table.timestamps(true, true);
        });
    }
}

export const dbConnector = fp(setupDatabase, {
    name: 'dbConnector'
}); 