export async function friendRoutes(fastify, options) {
    // Get user's friends
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const friends = await fastify.db.all(`
                SELECT 
                    u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    u.is_online,
                    u.last_seen,
                    f.status,
                    f.created_at as friendship_date
                FROM friendships f
                JOIN users u ON (
                    CASE
                        WHEN f.user_id = ? THEN f.friend_id = u.id
                        WHEN f.friend_id = ? THEN f.user_id = u.id
                    END
                )
                WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
                ORDER BY u.is_online DESC, u.last_seen DESC
            `, [request.user.id, request.user.id, request.user.id, request.user.id]);
            
            return friends;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get pending friend requests
    fastify.get('/pending', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const pending = await fastify.db.all(`
                SELECT 
                    u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    f.created_at as request_date
                FROM friendships f
                JOIN users u ON (f.user_id = u.id)
                WHERE f.friend_id = ? AND f.status = 'pending'
                ORDER BY f.created_at DESC
            `, request.user.id);
            
            return pending;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Send friend request
    fastify.post('/:userId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            // Check if user exists
            const user = await fastify.db.get('SELECT id FROM users WHERE id = ?', userId);
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            // Check if friendship already exists
            const existing = await fastify.db.get(`
                SELECT status FROM friendships 
                WHERE (user_id = ? AND friend_id = ?) 
                OR (user_id = ? AND friend_id = ?)
            `, [request.user.id, userId, userId, request.user.id]);
            
            if (existing) {
                reply.code(409).send({ error: 'Friendship already exists' });
                return;
            }
            
            // Create friendship request
            await fastify.db.run(`
                INSERT INTO friendships (user_id, friend_id, status)
                VALUES (?, ?, 'pending')
            `, [request.user.id, userId]);
            
            reply.code(201).send({ message: 'Friend request sent' });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Accept friend request
    fastify.put('/:userId/accept', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            const friendship = await fastify.db.get(`
                SELECT id, status FROM friendships 
                WHERE user_id = ? AND friend_id = ?
            `, [userId, request.user.id]);
            
            if (!friendship) {
                reply.code(404).send({ error: 'Friend request not found' });
                return;
            }
            
            if (friendship.status !== 'pending') {
                reply.code(400).send({ error: 'Invalid friend request status' });
                return;
            }
            
            await fastify.db.run(`
                UPDATE friendships 
                SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, friendship.id);
            
            reply.send({ message: 'Friend request accepted' });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Reject friend request
    fastify.put('/:userId/reject', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            const friendship = await fastify.db.get(`
                SELECT id, status FROM friendships 
                WHERE user_id = ? AND friend_id = ?
            `, [userId, request.user.id]);
            
            if (!friendship) {
                reply.code(404).send({ error: 'Friend request not found' });
                return;
            }
            
            if (friendship.status !== 'pending') {
                reply.code(400).send({ error: 'Invalid friend request status' });
                return;
            }
            
            // Delete the friendship record instead of marking it as rejected
            await fastify.db.run(`
                DELETE FROM friendships 
                WHERE id = ?
            `, friendship.id);
            
            reply.send({ message: 'Friend request rejected' });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Remove friend
    fastify.delete('/:userId', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            
            await fastify.db.run(`
                DELETE FROM friendships 
                WHERE (user_id = ? AND friend_id = ?) 
                OR (user_id = ? AND friend_id = ?)
            `, [request.user.id, userId, userId, request.user.id]);
            
            reply.code(204).send();
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
} 