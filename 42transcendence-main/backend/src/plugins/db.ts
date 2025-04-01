import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { Database, open } from 'sqlite';
import fs from 'fs';
import { FastifyPluginAsync } from 'fastify';
import SQLStatement from '../SQLStatement';

// Create a persistent directory for the database
const DB_DIR = join(__dirname, '../db');
const DB_PATH = join(DB_DIR, 'transcendence.db');

// Ensure the directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

declare module 'fastify' {
  export interface FastifyInstance {
    db: Database<sqlite3.Database, sqlite3.Statement>
  }
}

export interface DbPluginOptions {
  // Specify Support plugin options here

}

// Database setup function
const dbConnector: FastifyPluginAsync = async (fastify, options) => {
  try {
    fastify.log.info(`Opening SQLite database at: ${DB_PATH}`);

    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    // Create tables if they don't exist
    await db.exec(SQLStatement.SQLSCHEMA);
    // inject dummy data for testing
    // await db.exec(SQLStatement.SQLSAMPLEDATA);

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

export default fp<DbPluginOptions>(dbConnector, {
  name: 'db'
})