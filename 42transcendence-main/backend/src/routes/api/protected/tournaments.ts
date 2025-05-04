import { FastifyPluginAsync } from "fastify";
import { tournamentSchema } from "../../../model/jsonSchema";
import SQLStatement from "../../../SQLStatement";
import { getTournamentParticipants, createTournamentMatch, updateTournamentStatus, getTournamentMatches, getTournament } from "../../../service/tournamentSvc";
import { addPptToTMT, getAllTmt, getTmtbyID, rmPptfromTMT, setTMTbyID } from "../../../service/tournamentSvc";
import { Estatus } from "../../../model/tournamentModel";
import { isUniqueTournamentName } from '../../../service/tournamentSvc';


const tournamentRoutes : FastifyPluginAsync = async (fastify, options) => {

  // Get all tournaments
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: tournamentSchema
        }
      }
    }
  }, async (request, reply) => {
    try {
      const tournaments = await getAllTmt(fastify);
      return reply.code(200).send(tournaments);
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get tournament by ID
  fastify.get<{
    Params : {id : number}
  }>('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: tournamentSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params;
    try {
      
      const tournament = await fastify.db.get(SQLStatement.TMT_GET_TOURNA_BY_ID, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      tournament.participants = await fastify.db.all(SQLStatement.TMT_GET_PLAYER_IN_TOURNA_BY_ID, id);
      
      try {
        tournament.games = await fastify.db.all(SQLStatement.TMT_GET_ALL_GAME_WITH_PLAYER, id);
      } catch (err : unknown) {
        if (err instanceof Error)
          fastify.log.error(`Error fetching tournament games: ${err.message}`);
        tournament.games = [];
      }
      return tournament;
    } catch (err : unknown) {
      if (err instanceof Error)
        fastify.log.error(`Error fetching tournament ${id}: ${err.message}`);
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Create a new tournament
  fastify.post<{
    Body:{
      name: string
      description: string
      start_date : string
      end_date : string
      max_players: number
    }
  }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'start_date', 'end_date', 'max_players'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          description: { type: 'string', maxLength: 100 },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          max_players: {type: 'number'}
        }
      },
      response: {
        201: tournamentSchema
      }
    },
    errorHandler: (error, request, reply) => {
      if (error.validation) {
        fastify.log.error(`Validation error: ${JSON.stringify(error.validation)}`);
        
        let errorMessage = 'Validation error';
        
        if (error.validation.some(v => v.keyword === 'format' && v.params.format === 'date-time')) {
          errorMessage = 'Date format must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)';
          fastify.log.error(`Date format error in request: ${JSON.stringify(request.body)}`);
        }
        return reply.code(400).send({error: errorMessage, details: error.validation});
      }
      
      reply.send(error);
    }
  }, async (request, reply) => {
    try {
      const { name, description, start_date, end_date , max_players} = request.body;
      
      fastify.log.info(`Creating tournament: ${JSON.stringify(request.body)}`);
      
      if (!name || !start_date || !end_date) {
        fastify.log.error(`Missing required fields: ${!name ? 'name ' : ''}${!start_date ? 'start_date ' : ''}${!end_date ? 'end_date' : ''}`);
        return reply.code(400).send({ error: 'Missing required fields' });
      }
      
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);           
      const todayDate = new Date( new Date().toISOString().split('T')[0] );
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        fastify.log.error(`Invalid date format: start_date=${start_date}, end_date=${end_date}`);
        return reply.code(400).send({ error: 'Invalid date format' });
      }
      
      if (startDateObj >= endDateObj) {
        fastify.log.error('Start date must be before end date');
        return reply.code(400).send({ error: 'Start date must be before end date' });
      }

      if (startDateObj < todayDate)
      {
        fastify.log.error('Start date must be equal/greater than today date');
        return reply.code(400).send({ error: 'Start date must be equal/greater than today date' });
      }

      if (endDateObj < todayDate)
      {
        fastify.log.error('End date must be equal/greater than today date');
        return reply.code(400).send({ error: 'End date must be equal/greater than today date' });
      }

      const allowedNumbers = [2, 4, 8];
      if (!allowedNumbers.includes(max_players))
      {
        fastify.log.error('max_players not 2,4 or 8');
        return reply.code(400).send({ error: 'max_players not 2,4 or 8' });
      }
      
      const status = 'pending';

      const isUnique = await isUniqueTournamentName(fastify, name);
      if (!isUnique)
        return reply.code(400).send({ error: 'Tournament name already exists' });

      const result = await fastify.db.run(
          SQLStatement.TOURNA_INSERT_TOURNA,
          [name, description || '', start_date, end_date, status, max_players]
        );
      
      const tournamentId = result.lastID;
      if (!tournamentId)
        return reply.code(500).send({error:"game not created"});
      
      const tournament = await getTmtbyID(fastify, tournamentId);
      
      return reply.code(201).send(tournament);
    } catch (err : unknown) {
      if (err instanceof Error)
        fastify.log.error(`Error creating tournament: ${err.message}`);
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Update a tournament
  fastify.put<{
    Params : {id : number},
    Body:{
      name: string
      description: string
      start_date : string
      end_date : string
      status : Estatus
    }
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, start_date, end_date, status } = request.body;
      const tournament = await getTmtbyID(fastify, id);
      if (!tournament) 
        return reply.code(404).send({ error: 'Tournament not found' });
      await setTMTbyID(fastify, name, description, start_date, end_date, status, id);
      const updatedTournament = await getTmtbyID(fastify, id);
      return updatedTournament;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Register for tournament
  fastify.post<{
    Params : {id : number},
    Reply:{
      '4xx' : {error:string},
      500 : {error:string},
      201 : {message:string}
    }
  }>('/:id/register', async (request, reply) => {
    try {
      const { id } = request.params;
      const user_id = request.userid;
      
      const tournament = await getTmtbyID(fastify, id);
      
      if (!tournament) 
        return reply.code(404).send({ error: 'Tournament not found' });
      
      if (tournament.status !== Estatus.pending && tournament.status !== Estatus.open) 
        return reply.code(400).send({ error: 'Tournament is not open for registration' });

      const existingParticipant = await fastify.db.get(
        SQLStatement.TMT_GET_PLAYER_FROM_PARTICIPANT, 
        [id, user_id]
      );
      
      if (existingParticipant) {
        reply.code(409).send({ error: 'You are already registered for this tournament' });
        return;
      }
      
      await fastify.db.run(SQLStatement.TMT_INSERT_PLAYER_FROM_PARTICIPANT, [id, user_id, 'registered']);
      
      reply.code(201).send({ message: 'Successfully registered for tournament' });
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Unregister from tournament
  fastify.delete<{
    Params: { id : number},
    Reply: {
      204 : void,
      404 : {error : string},
      500 : {error : string},
    }
  }>('/:id/register', async (request, reply) => {
    try {
      const { id } = request.params;
      const user_id = request.userid;
      const tournament = await getTmtbyID(fastify, id);
      if (!tournament) 
        return reply.code(404).send({ error: 'Tournament not found' });

      await rmPptfromTMT(fastify, id, user_id);
      return reply.code(204).send();
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Join a tournament
  fastify.post<{
    Params : {id : number}
  }>('/:id/join', {
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
            id: { type: 'integer' },
            tournament_id: { type: 'integer' },
            user_id: { type: 'integer' },
            status: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: {type: 'string'}
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.userid;
      
      fastify.log.info(`User ${userId} attempting to join tournament ${id}`);
      
      const tournament = await getTmtbyID(fastify, id);
      
      if (!tournament) {
        fastify.log.error(`Tournament ${id} not found`);
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      const existingParticipant = await fastify.db.get(SQLStatement.TMT_GET_PARTICIPANT_BY_ID, [id, userId]);
      
      if (existingParticipant) {
        fastify.log.info(`User ${userId} is already registered for tournament ${id}`);
        return reply.code(409).send({ 
          error: 'You are already registered for this tournament',
          participant: existingParticipant
        });
        return;
      }


      const participants = await getTournamentParticipants(fastify, id);
      fastify.log.info(`participants: ${participants.length}`);
      if (participants)
      {
        if (participants.length >= tournament.max_players)
        {
          reply.code(409).send({ error: 'Already max players for tournament' });
          return;
        }
      }
      
      fastify.log.info(`Registering user ${userId} for tournament ${id}`);

      const result = await addPptToTMT(fastify, id, userId);
      
      if (!result || !result.lastID) {
        fastify.log.error(`Failed to insert tournament participant record`);
        return reply.code(500).send({ error: 'Failed to register for tournament' });
      }
      
      const participant = await fastify.db.get(SQLStatement.TMT_GET_TOURNA_PARTICIPANT, result.lastID);
      
      if (!participant) {
        fastify.log.error(`Failed to retrieve newly created participant record`);
        reply.code(500).send({ error: 'Failed to retrieve participant record' });
        return;
      }

      const checkParticipants = await getTournamentParticipants(fastify, id);
      if (checkParticipants)
      {
        if (checkParticipants.length === tournament.max_players)
        {
          await updateTournamentStatus(fastify, 'full', id);
        }
      }
      
      fastify.log.info(`User ${userId} successfully joined tournament ${id}`);
      return participant;

    } catch (err : unknown) {
      if (err instanceof Error)
        fastify.log.error(`Error joining tournament: ${err.message}`);
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Start a tournament
  fastify.post<{
    Params : {id : number}
  }>('/:id/start', {
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
            id: { type: 'integer' },
            tournament_id: { type: 'integer' },
            status: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const userId = request.userid;
      
      fastify.log.info(`User ${userId} attempting to start tournament ${id}`);
      
      const tournament = await fastify.db.get(SQLStatement.TMT_GET_TOURNA_BY_ID, id);
      if (!tournament) {
        fastify.log.error(`Tournament ${id} not found`);
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }

      if (tournament.status === 'active')
      {
        reply.code(400).send({ error: 'Tournament already started' });
        return;
      }

      if (tournament.status === 'completed')
      {
        reply.code(400).send({ error: 'Tournament already completed' });
        return;
      }

      if (tournament.status === 'pending')
      {
        reply.code(400).send({ error: 'Tournament participants not full yet' });
        return;
      }

      const participants = await getTournamentParticipants(fastify, id);

      fastify.log.info(`Tournament ${id} participants BEFORE shuffle: [${participants.map(p => p.id).join(', ')}]`);
      if (participants.length < 2)
      {
        fastify.log.error(`Tournament Participants less than 2`);
        reply.code(500).send({ error: 'Tournament Participants less than 2' });
        return;
      }

      for (let i = participants.length - 1; i > 0; i--)
        {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
      }
      fastify.log.info(`Tournament ${id} participants AFTER shuffle: [${participants.map(p => p.id).join(', ')}]`);

      let player1_id: number = -1;
      let player2_id: number = -1;
      let match_code: number = 1;
      let count: number = 0;
      let round:number = 1;
      for (const participant of participants)
      {
        if (player1_id == -1)
          player1_id = participant.id;
        else if (player2_id == -1)
        {
          player2_id = participant.id;
          await createTournamentMatch(fastify, player1_id, player2_id, round, match_code, id);
          player1_id = -1;
          player2_id = -1;
          match_code++;
        }
        count++;
      }

      let numberMatches: number = count / 2;
      if (numberMatches !== 1)
      {
        while (numberMatches / 2 != 1)
        {
          numberMatches = numberMatches / 2 ;
          round++;
          match_code = 1;
          for (let i: number = 0; i < numberMatches; i++)
          {
            await createTournamentMatch(fastify, -1, -1, round, match_code, id);
            match_code++;
          }
        }
        round++;
        match_code = 1;
        await createTournamentMatch(fastify, -1, -1, round, match_code, id);
    }

      await updateTournamentStatus(fastify, 'active', id);

      const tour = await getTournament(fastify, id);
      return tour;

    } catch (err : unknown) {
      if (err instanceof Error)
        fastify.log.error(`Error starting tournament: ${err.message}`);
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // Get tournament participants
  fastify.get<{
    Params : {id : number}
  }>('/:id/participants', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              display_name: { type: 'string' },
              avatar_url: { type: 'string' },
              status: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const tournament = await getTmtbyID(fastify, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      
      const participants = await fastify.db.all(SQLStatement.TMT_GET_ALL_PLAYERS_IN_TOURNA, id);

      return participants;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });


  // Get tournament matches
  fastify.get<{
    Params : {id : number}
  }>('/:id/matches', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              tournament_id: { type: 'integer' },
              player1_id: { type: 'integer' },
              player2_id: { type: 'integer' },
              player1_score: { type: 'integer' },
              player2_score: { type: 'integer' },
              winner_id: { type: 'integer' },
              game_id: { type: 'integer' },
              round: { type: 'integer' },
              match_order: { type: 'integer' },
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const tournament = await fastify.db.get(SQLStatement.TMT_GET_TOURNA_BY_ID, id);
      
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }

      const matches = await getTournamentMatches(fastify, id);

      return matches;
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

}


export default tournamentRoutes;