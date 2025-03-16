'use strict';

// Main API routes module
async function apiRoutes(fastify, options) {
  // Register user routes
  fastify.register(require('./users'), { prefix: '/users' });
  
  // Register game routes
  fastify.register(require('./games'), { prefix: '/games' });
  
  // Register tournament routes
  fastify.register(require('./tournaments'), { prefix: '/tournaments' });
  
  // Root API endpoint
  fastify.get('/', async (request, reply) => {
    return {
      name: 'ft-transcendence-api',
      version: '1.0.0',
      endpoints: [
        '/api/users',
        '/api/games',
        '/api/tournaments'
      ]
    };
  });
}

module.exports = apiRoutes; 