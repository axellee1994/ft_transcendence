'use strict';

const fp = require('fastify-plugin');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Database connection plugin
async function dbConnector(fastify, options) {
  try {
    // Open SQLite database connection
    const db = await open({
      filename: options.filename || 'pong.db',
      driver: sqlite3.Database
    });

    fastify.log.info('SQLite database connected');

    // Initialize database schema
    await initializeDatabase(db);

    // Decorate Fastify instance with db
    fastify.decorate('db', db);

    // Close database connection when Fastify closes
    fastify.addHook('onClose', async (instance) => {
      if (instance.db) {
        fastify.log.info('Closing database connection');
        await instance.db.close();
      }
    });
  } catch (err) {
    fastify.log.error('Database connection error:', err);
    throw err;
  }
}

// Initialize database schema
async function initializeDatabase(db) {
  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON;');

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create games table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player1_id INTEGER NOT NULL,
      player2_id INTEGER NOT NULL,
      player1_score INTEGER DEFAULT 0,
      player2_score INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player1_id) REFERENCES users(id),
      FOREIGN KEY (player2_id) REFERENCES users(id)
    );
  `);

  // Create tournaments table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tournaments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date TIMESTAMP,
      end_date TIMESTAMP,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create tournament_participants table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_participants (
      tournament_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'registered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tournament_id, user_id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Create tournament_games table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tournament_games (
      tournament_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      round INTEGER NOT NULL,
      match_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tournament_id, game_id),
      FOREIGN KEY (tournament_id) REFERENCES tournaments(id),
      FOREIGN KEY (game_id) REFERENCES games(id)
    );
  `);
}

// Export the plugin
module.exports = fp(dbConnector, {
  name: 'db-connector',
  fastify: '4.x'
}); 