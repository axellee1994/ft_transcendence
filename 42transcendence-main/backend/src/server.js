import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import staticFiles from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import plugins
import { dbConnector } from './plugins/db.js';
import { auth } from './plugins/auth.js';
import { bcryptHandler } from './plugins/bcrypt.js';
import { userRoutes } from './routes/users.js';
import { gameRoutes } from './routes/games.js';
import { authRoutes } from './routes/auth.js';
import { leaderboardRoutes } from './routes/leaderboard.js';

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

// Register plugins
await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
});

// Add static files from tests directory
await fastify.register(staticFiles, {
    root: path.join(__dirname, '../tests'),
    prefix: '/tests/',
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
await fastify.register(dbConnector);

// Register routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(gameRoutes, { prefix: '/api/games' });
await fastify.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

// Health check route
fastify.get('/health', async () => {
    return { status: 'ok' };
});

// Start the server
try {
    await fastify.listen({ port: 4002, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:4002');
} catch (err) {
    fastify.log.error(err);
    process.exit(1);
} 