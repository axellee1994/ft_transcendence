import fp from 'fastify-plugin';

async function authPlugin(fastify, options) {
    fastify.decorate('authenticate', async function(request, reply) {
        try {
            await request.jwtVerify();
            
            // Update user's online status and last_seen time
            if (request.user && request.user.id) {
                await fastify.db.run(`
                    UPDATE users 
                    SET is_online = 1, last_seen = CURRENT_TIMESTAMP 
                    WHERE id = ?
                `, request.user.id);
            }
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
}

export const auth = fp(authPlugin, {
    name: 'auth',
    dependencies: ['@fastify/jwt']
}); 