'use strict';

// Tournament routes module
async function tournamentRoutes(fastify, options) {
  // Get all tournaments
  fastify.get('/', async (request, reply) => {
    try {
      const tournaments = await fastify.db.all(`
        SELECT 
          id, 
          name, 
          description, 
          start_date, 
          end_date, 
          status, 
          created_at
        FROM tournaments
        ORDER BY created_at DESC
      `);
      
      return tournaments;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get tournament by ID
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const tournament = await fastify.db.get(`
        SELECT 
          id, 
          name, 
          description, 
          start_date, 
          end_date, 
          status, 
          created_at
        FROM tournaments
        WHERE id = ?
      `, [id]);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Get participants
      tournament.participants = await fastify.db.all(`
        SELECT 
          u.id, 
          u.username, 
          u.display_name, 
          tp.status
        FROM tournament_participants tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.tournament_id = ?
      `, [id]);
      
      // Get games
      tournament.games = await fastify.db.all(`
        SELECT 
          g.id, 
          g.player1_id, 
          g.player2_id, 
          g.player1_score, 
          g.player2_score, 
          g.status,
          tg.round,
          tg.match_number,
          u1.username as player1_username,
          u2.username as player2_username
        FROM tournament_games tg
        JOIN games g ON tg.game_id = g.id
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        WHERE tg.tournament_id = ?
        ORDER BY tg.round, tg.match_number
      `, [id]);
      
      return tournament;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new tournament
  fastify.post('/', async (request, reply) => {
    try {
      const { name, description, start_date, end_date } = request.body;
      
      // Validate required fields
      if (!name) {
        reply.code(400).send({ error: 'Tournament name is required' });
        return;
      }
      
      // Insert new tournament
      const result = await fastify.db.run(
        'INSERT INTO tournaments (name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
        [name, description, start_date, end_date, 'pending']
      );
      
      // Get the created tournament
      const newTournament = await fastify.db.get(
        'SELECT id, name, description, start_date, end_date, status, created_at FROM tournaments WHERE id = ?',
        [result.lastID]
      );
      
      reply.code(201).send(newTournament);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update a tournament
  fastify.put('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, start_date, end_date, status } = request.body;
      

      // Check if tournament exists
      const tournament = await fastify.db.get('SELECT id FROM tournaments WHERE id = ?', [id]);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Update tournament
      await fastify.db.run(
        'UPDATE tournaments SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, description, start_date, end_date, status, id]
      );
      
      // Get the updated tournament
      const updatedTournament = await fastify.db.get(
        'SELECT id, name, description, start_date, end_date, status, created_at, updated_at FROM tournaments WHERE id = ?',
        [id]
      );
      
      return updatedTournament;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Delete a tournament
  fastify.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // Check if tournament exists
      const tournament = await fastify.db.get('SELECT id FROM tournaments WHERE id = ?', [id]);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Delete tournament participants and games
      await fastify.db.run('DELETE FROM tournament_participants WHERE tournament_id = ?', [id]);
      await fastify.db.run('DELETE FROM tournament_games WHERE tournament_id = ?', [id]);
      
      // Delete tournament
      await fastify.db.run('DELETE FROM tournaments WHERE id = ?', [id]);
      
      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Register a user for a tournament
  fastify.post('/:id/participants', async (request, reply) => {
    try {
      const { id } = request.params;
      const { user_id } = request.body;
      
      // Validate required fields
      if (!user_id) {
        reply.code(400).send({ error: 'User ID is required' });
        return;
      }
      
      // Check if tournament exists
      const tournament = await fastify.db.get('SELECT id, status FROM tournaments WHERE id = ?', [id]);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Check if tournament is open for registration
      if (tournament.status !== 'pending' && tournament.status !== 'open') {
        reply.code(400).send({ error: 'Tournament is not open for registration' });
        return;
      }
      
      // Check if user exists
      const user = await fastify.db.get('SELECT id FROM users WHERE id = ?', [user_id]);
      if (!user) {
        reply.code(404).send({ error: 'User not found' });
        return;
      }
      
      // Check if user is already registered
      const existingParticipant = await fastify.db.get(
        'SELECT user_id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?',
        [id, user_id]
      );
      
      if (existingParticipant) {
        reply.code(409).send({ error: 'User is already registered for this tournament' });
        return;
      }
      
      // Register user for tournament
      await fastify.db.run(
        'INSERT INTO tournament_participants (tournament_id, user_id, status) VALUES (?, ?, ?)',
        [id, user_id, 'registered']
      );
      
      // Get the updated participant list
      const participants = await fastify.db.all(`
        SELECT 
          u.id, 
          u.username, 
          u.display_name, 
          tp.status
        FROM tournament_participants tp
        JOIN users u ON tp.user_id = u.id
        WHERE tp.tournament_id = ?
      `, [id]);
      
      reply.code(201).send(participants);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Remove a user from a tournament
  fastify.delete('/:id/participants/:userId', async (request, reply) => {
    try {
      const { id, userId } = request.params;
      
      // Check if tournament exists
      const tournament = await fastify.db.get('SELECT id, status FROM tournaments WHERE id = ?', [id]);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Check if tournament is open for changes
      if (tournament.status !== 'pending' && tournament.status !== 'open') {
        reply.code(400).send({ error: 'Tournament is not open for changes' });
        return;
      }
      
      // Check if user is registered
      const participant = await fastify.db.get(
        'SELECT user_id FROM tournament_participants WHERE tournament_id = ? AND user_id = ?',
        [id, userId]
      );
      
      if (!participant) {
        reply.code(404).send({ error: 'User is not registered for this tournament' });
        return;
      }
      
      // Remove user from tournament
      await fastify.db.run(
        'DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?',
        [id, userId]
      );
      
      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Add a game to a tournament
  fastify.post('/:id/games', async (request, reply) => {
    try {
      const { id } = request.params;
      const { game_id, round, match_number } = request.body;
      
      // Validate required fields
      if (!game_id || round === undefined || match_number === undefined) {
        reply.code(400).send({ error: 'Game ID, round, and match number are required' });
        return;
      }
      
      // Check if tournament exists
      const tournament = await fastify.db.get('SELECT id FROM tournaments WHERE id = ?', [id]);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      // Check if game exists
      const game = await fastify.db.get('SELECT id FROM games WHERE id = ?', [game_id]);
      if (!game) {
        reply.code(404).send({ error: 'Game not found' });
        return;
      }
      
      // Add game to tournament
      await fastify.db.run(
        'INSERT INTO tournament_games (tournament_id, game_id, round, match_number) VALUES (?, ?, ?, ?)',
        [id, game_id, round, match_number]
      );
      
      // Get the updated game
      const tournamentGame = await fastify.db.get(`
        SELECT 
          tg.tournament_id,
          tg.game_id,
          tg.round,
          tg.match_number,
          g.player1_id,
          g.player2_id,
          g.player1_score,
          g.player2_score,
          g.status,
          u1.username as player1_username,
          u2.username as player2_username
        FROM tournament_games tg
        JOIN games g ON tg.game_id = g.id
        JOIN users u1 ON g.player1_id = u1.id
        JOIN users u2 ON g.player2_id = u2.id
        WHERE tg.tournament_id = ? AND tg.game_id = ?
      `, [id, game_id]);
      
      reply.code(201).send(tournamentGame);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}

module.exports = tournamentRoutes; 
