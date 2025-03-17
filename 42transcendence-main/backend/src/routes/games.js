export async function gameRoutes(fastify, options) {
    const gameSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            player1_id: { type: 'integer' },
            player2_id: { type: 'integer' },
            winner_id: { type: 'integer' },
            player1_score: { type: 'integer' },
            player2_score: { type: 'integer' },
            game_type: { type: 'string', enum: ['single', 'multi'] },
            status: { type: 'string', enum: ['pending', 'active', 'completed'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
        }
    };

    // Create new game
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['player1_id', 'game_type'],
                properties: {
                    player1_id: { type: 'integer' },
                    player2_id: { type: 'integer' },
                    game_type: { type: 'string', enum: ['single', 'multi'] }
                }
            },
            response: {
                201: gameSchema
            }
        }
    }, async (request, reply) => {
        const game = await fastify.db('games')
            .insert({
                ...request.body,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date()
            })
            .returning('*');
        
        reply.code(201);
        return game;
    });

    // Get game by ID
    fastify.get('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: gameSchema
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const game = await fastify.db('games').where({ id }).first();
        
        if (!game) {
            reply.code(404).send({ error: 'Game not found' });
            return;
        }
        
        return game;
    });

    // Update game state
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
                    player1_score: { type: 'integer' },
                    player2_score: { type: 'integer' },
                    status: { type: 'string', enum: ['pending', 'active', 'completed'] },
                    winner_id: { type: 'integer' }
                }
            },
            response: {
                200: gameSchema
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const updates = request.body;
        
        const game = await fastify.db('games')
            .where({ id })
            .update({ ...updates, updated_at: new Date() })
            .returning('*');
        
        if (!game) {
            reply.code(404).send({ error: 'Game not found' });
            return;
        }

        // If game is completed, update player stats
        if (updates.status === 'completed' && updates.winner_id) {
            const game = await fastify.db('games').where({ id }).first();
            
            // Update winner stats
            await fastify.db('users')
                .where({ id: updates.winner_id })
                .increment('wins', 1);
            
            // Update loser stats
            const loserId = game.player1_id === updates.winner_id ? game.player2_id : game.player1_id;
            await fastify.db('users')
                .where({ id: loserId })
                .increment('losses', 1);
        }
        
        return game;
    });

    // Get active games
    fastify.get('/active', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: gameSchema
                }
            }
        }
    }, async (request, reply) => {
        const games = await fastify.db('games')
            .where({ status: 'active' })
            .orderBy('created_at', 'desc');
        
        return games;
    });

    // WebSocket endpoint for real-time game updates
    fastify.get('/live/:id', { websocket: true }, (connection, request) => {
        const { id } = request.params;
        
        connection.socket.on('message', async message => {
            try {
                const update = JSON.parse(message);
                
                // Update game state in database
                await fastify.db('games')
                    .where({ id })
                    .update({
                        player1_score: update.player1_score,
                        player2_score: update.player2_score,
                        updated_at: new Date()
                    });
                
                // Broadcast update to all connected clients
                connection.socket.send(JSON.stringify(update));
            } catch (error) {
                fastify.log.error(error);
            }
        });
    });
} 