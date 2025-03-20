export async function matchHistoryRoutes(fastify, options) {
    // Get user's match history
    fastify.get('/', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const matches = await fastify.db.all(`
                SELECT 
                    mh.id,
                    mh.result,
                    mh.created_at as match_date,
                    g.player1_score,
                    g.player2_score,
                    g.game_type,
                    u.username as opponent_username,
                    u.display_name as opponent_display_name,
                    u.avatar_url as opponent_avatar
                FROM match_history mh
                JOIN games g ON mh.game_id = g.id
                JOIN users u ON mh.opponent_id = u.id
                WHERE mh.user_id = ?
                ORDER BY mh.created_at DESC
            `, request.user.id);
            
            return matches;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get match history with filters
    fastify.get('/filter', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { 
                result, 
                game_type, 
                start_date, 
                end_date,
                limit = 20,
                offset = 0
            } = request.query;
            
            let query = `
                SELECT 
                    mh.id,
                    mh.result,
                    mh.created_at as match_date,
                    g.player1_score,
                    g.player2_score,
                    g.game_type,
                    u.username as opponent_username,
                    u.display_name as opponent_display_name,
                    u.avatar_url as opponent_avatar
                FROM match_history mh
                JOIN games g ON mh.game_id = g.id
                JOIN users u ON mh.opponent_id = u.id
                WHERE mh.user_id = ?
            `;
            
            const params = [request.user.id];
            
            if (result) {
                query += ' AND mh.result = ?';
                params.push(result);
            }
            
            if (game_type) {
                query += ' AND g.game_type = ?';
                params.push(game_type);
            }
            
            if (start_date) {
                query += ' AND mh.created_at >= ?';
                params.push(start_date);
            }
            
            if (end_date) {
                query += ' AND mh.created_at <= ?';
                params.push(end_date);
            }
            
            query += ' ORDER BY mh.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const matches = await fastify.db.all(query, params);
            
            // Get total count for pagination
            const countQuery = query
                .replace('SELECT *', 'SELECT COUNT(*) as total')
                .split('ORDER BY')[0]
                .replace('LIMIT ? OFFSET ?', '');
            
            const { total } = await fastify.db.get(countQuery, params.slice(0, -2));
            
            return {
                matches,
                total,
                limit,
                offset
            };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get match statistics
    fastify.get('/stats', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const stats = await fastify.db.get(`
                SELECT 
                    COUNT(*) as total_matches,
                    SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
                    SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
                    SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
                    SUM(CASE WHEN game_type = 'single' THEN 1 ELSE 0 END) as single_player_matches,
                    SUM(CASE WHEN game_type = 'multi' THEN 1 ELSE 0 END) as multiplayer_matches
                FROM match_history mh
                JOIN games g ON mh.game_id = g.id
                WHERE mh.user_id = ?
            `, request.user.id);
            
            return stats;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
} 