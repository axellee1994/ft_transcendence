'use strict';

// Game routes module
async function gameRoutes(fastify, options) {
  // Get all games
  fastify.get('/', async (request, reply) => {
    try {
      const games = await fastify.db.all(`
        SELECT 
          g.id, 
          g.player1_id, 
          g.player2_id, 
          g.player1_score, 
          g.player2_score, 
          g.status, 
          g.created_at,
          u1.username as player1_username,
          u2.username as player2_username
        FROM games g
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        ORDER BY g.created_at DESC
      `);
      
      return games;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get game by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const game = await fastify.db.get(`
        SELECT 
          g.id, 
          g.player1_id, 
          g.player2_id, 
          g.player1_score, 
          g.player2_score, 
          g.status, 
          g.created_at,
          u1.username as player1_username,
          u2.username as player2_username
        FROM games g
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        WHERE g.id = ?
      `, [id]);
      
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

  // Create a new game
  fastify.post('/', async (request, reply) => {
    try {
      const { player1_id, player2_id } = request.body;
      
      // Validate required fields
      if (!player1_id || !player2_id) {
        reply.code(400).send({ error: 'Both player IDs are required' });
        return;
      }
      
      // Check if players exist
      const player1 = await fastify.db.get('SELECT id FROM users WHERE id = ?', [player1_id]);
      const player2 = await fastify.db.get('SELECT id FROM users WHERE id = ?', [player2_id]);
      
      if (!player1 || !player2) {
        reply.code(404).send({ error: 'One or both players not found' });
        return;
      }
      
      // Insert new game
      const result = await fastify.db.run(
        'INSERT INTO games (player1_id, player2_id, status) VALUES (?, ?, ?)',
        [player1_id, player2_id, 'pending']
      );
      
      // Get the created game
      const newGame = await fastify.db.get(`
        SELECT 
          g.id, 
          g.player1_id, 
          g.player2_id, 
          g.player1_score, 
          g.player2_score, 
          g.status, 
          g.created_at,
          u1.username as player1_username,
          u2.username as player2_username
        FROM games g
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        WHERE g.id = ?
      `, [result.lastID]);
      
      reply.code(201).send(newGame);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update game status and scores
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { player1_score, player2_score, status } = request.body;
      
      // Check if game exists
      const game = await fastify.db.get('SELECT id FROM games WHERE id = ?', [id]);
      if (!game) {
        reply.code(404).send({ error: 'Game not found' });
        return;
      }
      
      // Update game
      await fastify.db.run(
        'UPDATE games SET player1_score = ?, player2_score = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [player1_score, player2_score, status, id]
      );
      
      // Get the updated game
      const updatedGame = await fastify.db.get(`
        SELECT 
          g.id, 
          g.player1_id, 
          g.player2_id, 
          g.player1_score, 
          g.player2_score, 
          g.status, 
          g.created_at,
          g.updated_at,
          u1.username as player1_username,
          u2.username as player2_username
        FROM games g
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        WHERE g.id = ?
      `, [id]);
      
      return updatedGame;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Delete a game
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if game exists
      const game = await fastify.db.get('SELECT id FROM games WHERE id = ?', [id]);
      if (!game) {
        reply.code(404).send({ error: 'Game not found' });
        return;
      }
      
      // Delete game
      await fastify.db.run('DELETE FROM games WHERE id = ?', [id]);
      
      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // WebSocket endpoint for real-time game updates
  fastify.get('/ws/:id', { websocket: true }, (connection, request) => {
    const gameId = request.params.id;
    
    fastify.log.info(`WebSocket connection established for game ${gameId}`);
    
    // Store connection in a map (in a real app, you'd use a more robust solution)
    if (!fastify.gameConnections) {
      fastify.gameConnections = new Map();
    }
    
    if (!fastify.gameConnections.has(gameId)) {
      fastify.gameConnections.set(gameId, new Set());
    }
    
    fastify.gameConnections.get(gameId).add(connection.socket);
    
    // Handle incoming messages
    connection.socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'gameUpdate') {
          // Update game state in database
          if (data.player1_score !== undefined && data.player2_score !== undefined) {
            await fastify.db.run(
              'UPDATE games SET player1_score = ?, player2_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [data.player1_score, data.player2_score, gameId]
            );
          }
          
          // Broadcast update to all connected clients for this game
          const connections = fastify.gameConnections.get(gameId);
          if (connections) {
            const updateMessage = JSON.stringify({
              type: 'gameUpdate',
              gameId,
              ...data
            });
            
            for (const client of connections) {
              if (client !== connection.socket && client.readyState === 1) {
                client.send(updateMessage);
              }
            }
          }
        }
      } catch (err) {
        fastify.log.error('Error processing WebSocket message:', err);
      }
    });
    
    // Handle connection close
    connection.socket.on('close', () => {
      fastify.log.info(`WebSocket connection closed for game ${gameId}`);
      
      const connections = fastify.gameConnections.get(gameId);
      if (connections) {
        connections.delete(connection.socket);
        
        if (connections.size === 0) {
          fastify.gameConnections.delete(gameId);
        }
      }
    });
  });
}

module.exports = gameRoutes; 