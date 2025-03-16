'use strict';

// Import Fastify
const fastify = require('fastify')({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register plugins
async function registerPlugins() {
  // CORS to allow frontend to communicate with backend
  await fastify.register(require('@fastify/cors'), {
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // WebSocket for real-time game communication
  await fastify.register(require('@fastify/websocket'), {
    options: { maxPayload: 1048576 } // 1MB max payload
  });

  // Database connection
  await fastify.register(require('./plugins/db'));
}

// Register routes
async function registerRoutes() {
  // Health check route
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // API routes
  await fastify.register(require('./routes/api'), { prefix: '/api' });
}

// Start the server
async function start() {
  try {
    // Register all plugins
    await registerPlugins();
    
    // Register all routes
    await registerRoutes();
    
    // Listen on all interfaces
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    
    fastify.log.info(`Server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  fastify.log.info('Shutting down server...');
  await fastify.close();
  process.exit(0);
});

// Start the server
start(); 