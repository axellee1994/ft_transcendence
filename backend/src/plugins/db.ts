import fp from 'fastify-plugin';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { Database, open } from 'sqlite';
import fs from 'fs';
import { FastifyPluginAsync } from 'fastify';
import SQLStatement from '../SQLStatement';

const DB_DIR = join(__dirname, '../db');
const DB_PATH = join(DB_DIR, 'transcendence.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

declare module 'fastify' {
  export interface FastifyInstance {
    db: Database<sqlite3.Database, sqlite3.Statement>
  }
}

export interface DbPluginOptions {

}

const dbConnector: FastifyPluginAsync = async (fastify, options) => {
  try {
    fastify.log.info(`Opening SQLite database at: ${DB_PATH}`);

    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    await db.exec(SQLStatement.SQLSCHEMA);

    const testResult = await db.get('SELECT sqlite_version() as version');
    fastify.log.info(`Connected to SQLite version: ${testResult.version}`);

    fastify.decorate('db', db);

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