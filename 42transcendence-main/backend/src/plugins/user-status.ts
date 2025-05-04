import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import ConstantsPong from '../ConstantsPong';
import SQLStatement from '../SQLStatement';

export interface UserStatusPluginOptions {

}

const userStatusPlugin:FastifyPluginAsync = async(fastify, options) => {
    
    const statusInterval = setInterval(async () => {
        try {
            await fastify.db.run(SQLStatement.PLUGIN_CHECK_ONLINE);
        } catch (err) {
            fastify.log.error('Error updating user status:', err);
        }
    }, ConstantsPong.ONLINE_TIMEOUT);
    
    fastify.addHook('onClose', () => {
        clearInterval(statusInterval);
    });
}

export default fp<UserStatusPluginOptions>(userStatusPlugin,{
    name: 'userStatus',
    dependencies: ['db']
})