import { FastifyPluginAsync } from 'fastify'
// import serveStatic from '@fastify/static'; // Commented out
// import path from 'node:path'; // Commented out

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // void fastify.register(serveStatic, { // Commented out
  //   root: path.join(__dirname, 'public'), // Commented out
  // }); // Commented out

  // You can add root API routes here later if needed
  // Example:
  // fastify.get('/', async (request, reply) => {
  //   return { message: 'Welcome to the API' };
  // });
}

export default root;
