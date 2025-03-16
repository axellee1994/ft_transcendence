const fastify = require('fastify')({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});
const path = require('path');
const port = 3000;

// Register Fastify Static plugin
const registerPlugins = async () => {
  // For serving test files
  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../tests'),
    prefix: '/tests/',
    decorateReply: false
  });

  // For serving static files from dist
  await fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, '../dist'),
    prefix: '/',
    decorateReply: true
  });
};

// Handle client-side routing by redirecting all requests to index.html
// except for requests to /tests
fastify.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/tests/')) {
    reply.code(404).send({ error: 'Not found' });
  } else {
    reply.sendFile('index.html');
  }
});

// Start the server
const start = async () => {
  try {
    await registerPlugins();
    await fastify.listen({ port: port, host: '0.0.0.0' });
    fastify.log.info(`Frontend server running at http://localhost:${port}`);
    fastify.log.info(`Test files available at http://localhost:${port}/tests`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 