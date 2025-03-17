export async function userRoutes(fastify, options) {
    const userSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar_url: { type: 'string' },
            wins: { type: 'integer' },
            losses: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
        }
    };

    // Get all users
    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: userSchema
                }
            }
        }
    }, async (request, reply) => {
        const users = await fastify.db('users').select('*');
        return users;
    });

    // Create a new user
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['username'],
                properties: {
                    username: { type: 'string' },
                    display_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    avatar_url: { type: 'string' }
                }
            },
            response: {
                201: userSchema
            }
        }
    }, async (request, reply) => {
        const { username, display_name, email, avatar_url } = request.body;
        
        try {
            // Use ISO string format for dates
            const now = new Date().toISOString();
            const [user] = await fastify.db('users')
                .insert({
                    username,
                    display_name: display_name || username,
                    email: email || null,
                    avatar_url: avatar_url || null,
                    wins: 0,
                    losses: 0,
                    created_at: now,
                    updated_at: now
                })
                .returning('*');
            
            reply.code(201);
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                reply.code(400).send({ error: 'Username or email already exists' });
                return;
            }
            throw error;
        }
    });

    // Get user by ID
    fastify.get('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: userSchema
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const user = await fastify.db('users').where({ id }).first();
        
        if (!user) {
            reply.code(404).send({ error: 'User not found' });
            return;
        }
        
        return user;
    });

    // Update user
    fastify.put('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    avatar_url: { type: 'string' }
                }
            },
            response: {
                200: userSchema
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const updates = request.body;
        
        try {
            const user = await fastify.db('users')
                .where({ id })
                .update({ ...updates, updated_at: new Date() })
                .returning('*');
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                reply.code(400).send({ error: 'Username or email already exists' });
                return;
            }
            throw error;
        }
    });

    // Get user stats
    fastify.get('/:id/stats', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        wins: { type: 'integer' },
                        losses: { type: 'integer' },
                        winRate: { type: 'number' },
                        totalGames: { type: 'integer' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const user = await fastify.db('users').where({ id }).first();
        
        if (!user) {
            reply.code(404).send({ error: 'User not found' });
            return;
        }
        
        const totalGames = user.wins + user.losses;
        const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
        
        return {
            wins: user.wins,
            losses: user.losses,
            winRate: Math.round(winRate * 100) / 100,
            totalGames
        };
    });

    // Get user match history
    fastify.get('/:id/matches', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const matches = await fastify.db('games')
            .where('player1_id', id)
            .orWhere('player2_id', id)
            .orderBy('created_at', 'desc')
            .limit(10);
            
        return matches;
    });
} 