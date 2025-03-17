export async function leaderboardRoutes(fastify, options) {
    const leaderboardSchema = {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'integer' },
                username: { type: 'string' },
                wins: { type: 'integer' },
                losses: { type: 'integer' },
                winRate: { type: 'number' },
                totalGames: { type: 'integer' },
                rank: { type: 'integer' }
            }
        }
    };

    // Get global leaderboard
    fastify.get('/', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    limit: { type: 'integer', default: 10 },
                    offset: { type: 'integer', default: 0 }
                }
            },
            response: {
                200: leaderboardSchema
            }
        }
    }, async (request, reply) => {
        const { limit = 10, offset = 0 } = request.query;
        
        const users = await fastify.db('users')
            .select('*')
            .orderBy('wins', 'desc')
            .limit(limit)
            .offset(offset);
        
        const leaderboard = users.map((user, index) => {
            const totalGames = user.wins + user.losses;
            const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
            
            return {
                ...user,
                winRate: Math.round(winRate * 100) / 100,
                totalGames,
                rank: offset + index + 1
            };
        });
        
        return leaderboard;
    });

    // Get user's rank
    fastify.get('/rank/:userId', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'integer' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        rank: { type: 'integer' },
                        totalPlayers: { type: 'integer' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { userId } = request.params;
        
        // Get user's wins
        const user = await fastify.db('users')
            .where({ id: userId })
            .first();
            
        if (!user) {
            reply.code(404).send({ error: 'User not found' });
            return;
        }
        
        // Count players with more wins
        const betterPlayers = await fastify.db('users')
            .where('wins', '>', user.wins)
            .count('id as count')
            .first();
            
        const totalPlayers = await fastify.db('users')
            .count('id as count')
            .first();
            
        return {
            rank: betterPlayers.count + 1,
            totalPlayers: totalPlayers.count
        };
    });

    // Get top players for each game type
    fastify.get('/top/:gameType', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    gameType: { type: 'string', enum: ['single', 'multi'] }
                }
            },
            response: {
                200: leaderboardSchema
            }
        }
    }, async (request, reply) => {
        const { gameType } = request.params;
        
        const topPlayers = await fastify.db('users')
            .select(
                'users.*',
                fastify.db.raw('COUNT(DISTINCT games.id) as game_count'),
                fastify.db.raw('SUM(CASE WHEN games.winner_id = users.id THEN 1 ELSE 0 END) as game_wins')
            )
            .leftJoin('games', function() {
                this.on('users.id', '=', 'games.player1_id')
                    .orOn('users.id', '=', 'games.player2_id');
            })
            .where('games.game_type', gameType)
            .groupBy('users.id')
            .orderBy('game_wins', 'desc')
            .limit(10);
            
        return topPlayers.map((player, index) => ({
            ...player,
            rank: index + 1,
            winRate: player.game_count > 0 ? (player.game_wins / player.game_count) * 100 : 0
        }));
    });
} 