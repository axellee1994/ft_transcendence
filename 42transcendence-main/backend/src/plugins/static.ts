/*import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import path from 'node:path';

// Serve the static frontend files (HTML, JS, CSS)
const staticPlugin: FastifyPluginAsync = async (fastify, opts) => {
  const publicPath = path.join(__dirname, '..', '..', 'public');

  fastify.log.info(`Serving static files from: ${publicPath}`);

  void fastify.register(fastifyStatic, {
    root: publicPath,
  });
};

export default fp(staticPlugin, { name: 'static-server' }); */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';

// Serve the static frontend files (HTML, JS, CSS)
const staticPlugin: FastifyPluginAsync = async (fastify, opts) => {
  // Point to the location INSIDE the container where frontend files were copied by Dockerfile
  const internalPublicPath = '/app/public'; 

  fastify.log.info(`Serving static files from internal path: ${internalPublicPath}`);

  void fastify.register(fastifyStatic, {
    root: internalPublicPath, // Use the absolute internal path
    prefix: '', // Serve files from the root URL path (e.g., /index.html)
  
  });

  // Handle SPA routing fallback: All non-API, non-file requests should serve index.html
  fastify.setNotFoundHandler(async (request, reply) => {
    // Basic check: if path doesn't look like an API call or a direct file request,
    if (!request.raw.url?.startsWith('/api') && !request.raw.url?.includes('.')) {
      return reply.sendFile('index.html', internalPublicPath);
    }
    return reply.code(404).send({ message: 'Resource not found' });
  });
};

export default fp(staticPlugin, { name: 'static-server' });