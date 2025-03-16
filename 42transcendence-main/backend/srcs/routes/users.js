'use strict';

// User routes module
async function userRoutes(fastify, options) {
  // Get all users
  fastify.get('/', async (request, reply) => {
    try {
      const users = await fastify.db.all('SELECT id, username, display_name, avatar, created_at FROM users');
      return users;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get user by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const user = await fastify.db.get(
        'SELECT id, username, display_name, avatar, created_at FROM users WHERE id = ?',
        [id]
      );
      
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      
      return user;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new user
  fastify.post('/', async (request, reply) => {
    try {
      const { username, display_name, avatar } = request.body;
      
      // Validate required fields
      if (!username || !display_name) {
        reply.code(400).send({ error: 'Username and display name are required' });
        return;
      }
      
      // Check if username already exists
      const existingUser = await fastify.db.get('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUser) {
        reply.code(409).send({ error: 'Username already exists' });
        return;
      }
      
      // Insert new user
      const result = await fastify.db.run(
        'INSERT INTO users (username, display_name, avatar) VALUES (?, ?, ?)',
        [username, display_name, avatar || null]
      );
      
      // Get the created user
      const newUser = await fastify.db.get(
        'SELECT id, username, display_name, avatar, created_at FROM users WHERE id = ?',
        [result.lastID]
      );
      
      reply.code(201).send(newUser);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update a user
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { display_name, avatar } = request.body;
      
      // Check if user exists
      const user = await fastify.db.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      
      // Update user
      await fastify.db.run(
        'UPDATE users SET display_name = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [display_name, avatar, id]
      );
      
      // Get the updated user
      const updatedUser = await fastify.db.get(
        'SELECT id, username, display_name, avatar, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      
      return updatedUser;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Delete a user
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if user exists
      const user = await fastify.db.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      
      // Delete user
      await fastify.db.run('DELETE FROM users WHERE id = ?', [id]);
      
      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get user game history
  fastify.get('/:id/games', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if user exists
      const user = await fastify.db.get('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      
      // Get games where user is player1 or player2
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
        WHERE g.player1_id = ? OR g.player2_id = ?
        ORDER BY g.created_at DESC
      `, [id, id]);
      
      return games;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}

module.exports = userRoutes; 