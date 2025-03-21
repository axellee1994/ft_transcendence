import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import staticFiles from '@fastify/static';
import multipart from '@fastify/multipart';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import plugins
import { db } from './plugins/db.js';
import { auth } from './plugins/auth.js';
import { bcryptHandler } from './plugins/bcrypt.js';
import { userStatus } from './plugins/user-status.js';
import { userRoutes } from './routes/users.js';
import { gameRoutes } from './routes/games.js';
import { authRoutes } from './routes/auth.js';
import { leaderboardRoutes } from './routes/leaderboard.js';
import { tournamentRoutes } from './routes/tournaments.js';
import { friendRoutes } from './routes/friends.js';
import { matchHistoryRoutes } from './routes/match-history.js';

const fastify = Fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        },
    },
});

// Register CORS plugin first
await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400, // Cache preflight requests for 24 hours
    preflight: true,
    preflightContinue: true
});

// Configure multipart for file uploads
await fastify.register(multipart, {
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // Use env var or default to 5MB
        files: 1 // Allow only 1 file per request
    },
    attachFieldsToBody: false,
    onFile: (fieldname, stream, filename, encoding, mimetype) => {
        // This is just for setup, actual handling is done in the routes
    }
});

// Add static files from tests directory
await fastify.register(staticFiles, {
    root: path.join(__dirname, '../tests'),
    prefix: '/tests/',
    decorateReply: false
});

// Add static files for avatars
await fastify.register(staticFiles, {
    root: process.env.AVATAR_UPLOADS_DIR || path.join(__dirname, '../uploads/avatars'),
    prefix: '/avatars/',
    decorateReply: false
});

await fastify.register(websocket);
await fastify.register(jwt, { secret: 'your-secret-key' });
await fastify.register(auth);
await fastify.register(bcryptHandler);

// Register Swagger
await fastify.register(swagger, {
    swagger: {
        info: {
            title: '42 Transcendence API',
            description: 'API documentation for 42 Transcendence Pong Game',
            version: '1.0.0',
        },
        host: 'localhost:4002',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    },
});

// Register database connector
await fastify.register(db);

// Register user status plugin after database
await fastify.register(userStatus);

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(gameRoutes, { prefix: '/api/games' });
await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
await fastify.register(tournamentRoutes, { prefix: '/api/tournaments' });
await fastify.register(friendRoutes, { prefix: '/api/friends' });
await fastify.register(matchHistoryRoutes, { prefix: '/api/match-history' });

// Health check endpoint
fastify.get('/api/health', async (request, reply) => {
    return { status: 'ok' };
});

// Start the server
try {
    await fastify.listen({ 
        port: parseInt(process.env.PORT) || 4002, 
        host: process.env.HOST || '0.0.0.0' 
    });
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
} 