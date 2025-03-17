import fp from 'fastify-plugin';

async function authPlugin(fastify, options) {
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify();
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
}

export const auth = fp(authPlugin, {
    name: 'auth',
    dependencies: ['@fastify/jwt']
}); 