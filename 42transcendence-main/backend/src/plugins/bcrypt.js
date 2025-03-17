import fp from 'fastify-plugin';
import bcrypt from 'bcrypt';

async function bcryptPlugin(fastify, options) {
    fastify.decorate('bcrypt', {
        async hash(password) {
            const salt = await bcrypt.genSalt(10);
            return bcrypt.hash(password, salt);
        },
        async compare(password, hash) {
            return bcrypt.compare(password, hash);
        }
    });
}

export const bcryptHandler = fp(bcryptPlugin, {
    name: 'bcrypt'
}); 