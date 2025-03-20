export async function tournamentRoutes(fastify, options) {
  // Get all tournaments
  fastify.get('/', async (request, reply) => {
    try {
      const tournaments = await fastify.db.all(`
        SELECT * FROM tournaments 
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
        SELECT * FROM tournaments WHERE id = ?
      `, id);
      
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
      `, id);
      
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
          p1.username as player1_username,
          p2.username as player2_username
        FROM tournament_games tg
        JOIN games g ON tg.game_id = g.id
        JOIN users p1 ON g.player1_id = p1.id
        JOIN users p2 ON g.player2_id = p2.id
        WHERE tg.tournament_id = ?
        ORDER BY tg.round, tg.match_number
      `, id);
      
      return tournament;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new tournament
  fastify.post('/', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { name, description, start_date, end_date } = request.body;
      
      if (!name) {
        reply.code(400).send({ error: 'Tournament name is required' });
        return;
      }
      
      const result = await fastify.db.run(`
        INSERT INTO tournaments (name, description, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?)
      `, [name, description, start_date, end_date, 'pending']);
      
      const newTournament = await fastify.db.get(`
        SELECT * FROM tournaments WHERE id = ?
      `, result.lastID);
      
      reply.code(201).send(newTournament);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update a tournament
  fastify.put('/:id', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, start_date, end_date, status } = request.body;
      
      const tournament = await fastify.db.get(`
        SELECT id FROM tournaments WHERE id = ?
      `, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      await fastify.db.run(`
        UPDATE tournaments 
        SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, description, start_date, end_date, status, id]);
      
      const updatedTournament = await fastify.db.get(`
        SELECT * FROM tournaments WHERE id = ?
      `, id);
      
      return updatedTournament;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Register for tournament
  fastify.post('/:id/register', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user_id = request.user.id;
      
      const tournament = await fastify.db.get(`
        SELECT id, status FROM tournaments WHERE id = ?
      `, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      if (tournament.status !== 'pending' && tournament.status !== 'open') {
        reply.code(400).send({ error: 'Tournament is not open for registration' });
        return;
      }
      
      const existingParticipant = await fastify.db.get(`
        SELECT user_id FROM tournament_participants 
        WHERE tournament_id = ? AND user_id = ?
      `, [id, user_id]);
      
      if (existingParticipant) {
        reply.code(409).send({ error: 'You are already registered for this tournament' });
        return;
      }
      
      await fastify.db.run(`
        INSERT INTO tournament_participants (tournament_id, user_id, status)
        VALUES (?, ?, ?)
      `, [id, user_id, 'registered']);
      
      reply.code(201).send({ message: 'Successfully registered for tournament' });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Unregister from tournament
  fastify.delete('/:id/register', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const user_id = request.user.id;
      
      const tournament = await fastify.db.get(`
        SELECT id FROM tournaments WHERE id = ?
      `, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      await fastify.db.run(`
        DELETE FROM tournament_participants 
        WHERE tournament_id = ? AND user_id = ?
      `, [id, user_id]);
      
      reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
} 