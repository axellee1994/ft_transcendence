import { FastifyPluginAsync } from 'fastify'
import serveStatic from '@fastify/static';
import path from 'node:path';
import fastifyHelmet from '@fastify/helmet';

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  void fastify.register(fastifyHelmet, {
    global : true,
    contentSecurityPolicy: {
      directives: {
        "script-src-attr": ["'unsafe-inline'"],
        "imgSrc": ["'self'", 'data:', 'blob:']
      },
    }
  })

  void fastify.register(serveStatic, {
    root: path.join(__dirname, '../public'),
  });


  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/"))
      return reply.code(404).send({
        message: `Route ${request.method}:${request.url} not found`,
        statusCode : 404,
        error: "Not Found"
    })
    return reply.sendFile('index.html');
  });

}

export default root;
