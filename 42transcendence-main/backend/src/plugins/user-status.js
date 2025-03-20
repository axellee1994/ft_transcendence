import fp from 'fastify-plugin';

async function userStatusPlugin(fastify, options) {
    // Set users offline after 5 minutes of inactivity
    const ONLINE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Check and update user status every minute
    const statusInterval = setInterval(async () => {
        try {
            // Find users who haven't been active in the last 5 minutes and set them offline
            await fastify.db.run(`
                UPDATE users 
                SET is_online = 0 
                WHERE is_online = 1 AND datetime(last_seen) < datetime('now', '-5 minutes')
            `);
        } catch (err) {
            fastify.log.error('Error updating user status:', err);
        }
    }, 60000); // Check every minute
    
    // Clean up interval on Fastify close
    fastify.addHook('onClose', () => {
        clearInterval(statusInterval);
    });
}

export const userStatus = fp(userStatusPlugin, {
    name: 'userStatus',
    dependencies: ['db']
}); 