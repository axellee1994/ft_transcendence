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

    // Get all games
    fastify.get('/', {
        schema: {
            response: {
                200: {
                    type: 'array',
                    items: gameSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const games = await fastify.db.all(`
                SELECT * FROM games 
                ORDER BY created_at DESC
            `);
            return games;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

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
        try {
            const result = await fastify.db.run(`
                INSERT INTO games (player1_id, player2_id, game_type, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [request.body.player1_id, request.body.player2_id, request.body.game_type, 'pending']);
            
            const game = await fastify.db.get(`
                SELECT * FROM games WHERE id = ?
            `, result.lastID);
            
            reply.code(201);
            return game;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
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
        try {
            const { id } = request.params;
            const game = await fastify.db.get(`
                SELECT * FROM games WHERE id = ?
            `, id);
            
            if (!game) {
                reply.code(404).send({ error: 'Game not found' });
                return;
            }
            
            return game;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
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
        try {
            const { id } = request.params;
            const updates = request.body;
            
            await fastify.db.run(`
                UPDATE games 
                SET player1_score = ?, player2_score = ?, status = ?, winner_id = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [updates.player1_score, updates.player2_score, updates.status, updates.winner_id, id]);
            
            const game = await fastify.db.get(`
                SELECT * FROM games WHERE id = ?
            `, id);
            
            if (!game) {
                reply.code(404).send({ error: 'Game not found' });
                return;
            }

            // If game is completed, update player stats
            if (updates.status === 'completed' && updates.winner_id) {
                // Update winner stats
                await fastify.db.run(`
                    UPDATE users 
                    SET wins = wins + 1 
                    WHERE id = ?
                `, updates.winner_id);
                
                // Update loser stats
                const loserId = game.player1_id === updates.winner_id ? game.player2_id : game.player1_id;
                await fastify.db.run(`
                    UPDATE users 
                    SET losses = losses + 1 
                    WHERE id = ?
                `, loserId);
            }
            
            return game;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
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
        try {
            const games = await fastify.db.all(`
                SELECT * FROM games 
                WHERE status = 'active' 
                ORDER BY created_at DESC
            `);
            
            return games;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // WebSocket endpoint for real-time game updates
    fastify.get('/live/:id', { websocket: true }, (connection, request) => {
        const { id } = request.params;
        
        connection.socket.on('message', async message => {
            try {
                const update = JSON.parse(message);
                
                // Update game state in database
                await fastify.db.run(`
                    UPDATE games 
                    SET player1_score = ?, player2_score = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [update.player1_score, update.player2_score, id]);
                
                // Broadcast update to all connected clients
                connection.socket.send(JSON.stringify(update));
            } catch (error) {
                fastify.log.error(error);
            }
        });
    });
} 