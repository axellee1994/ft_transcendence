import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { open } from 'sqlite';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a persistent directory for the database
const DB_DIR = join(__dirname, '../db');
const DB_PATH = join(DB_DIR, 'transcendence.db');

// Ensure the directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Database setup function
async function dbConnector(fastify, options) {
    try {
        fastify.log.info(`Opening SQLite database at: ${DB_PATH}`);
        
        const db = await open({
            filename: DB_PATH,
            driver: sqlite3.Database
        });
        
        // Create tables if they don't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                display_name TEXT,
                avatar_url TEXT,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                is_online BOOLEAN DEFAULT 0,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS game_settings (
                user_id INTEGER PRIMARY KEY,
                difficulty TEXT DEFAULT 'medium',
                game_speed INTEGER DEFAULT 1,
                invert_controls BOOLEAN DEFAULT 0,
                enable_sound BOOLEAN DEFAULT 1,
                enable_music BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                player1_id INTEGER NOT NULL,
                player2_id INTEGER NOT NULL,
                player1_score INTEGER DEFAULT 0,
                player2_score INTEGER DEFAULT 0,
                winner_id INTEGER,
                game_mode TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player1_id) REFERENCES users(id),
                FOREIGN KEY (player2_id) REFERENCES users(id),
                FOREIGN KEY (winner_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS friendships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                friend_id INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (friend_id) REFERENCES users(id),
                UNIQUE(user_id, friend_id)
            );
        `);
        
        // Test the database connection with a simple query
        const testResult = await db.get('SELECT sqlite_version() as version');
        fastify.log.info(`Connected to SQLite version: ${testResult.version}`);
        
        // Decorate Fastify instance with our db
        fastify.decorate('db', db);

        // Close database connection when Fastify closes
        fastify.addHook('onClose', async (instance) => {
            await instance.db.close();
        });

    } catch (err) {
        console.error('Error setting up database:', err);
        throw err;
    }
}

export const db = fp(dbConnector, {
    name: 'db'
}); 