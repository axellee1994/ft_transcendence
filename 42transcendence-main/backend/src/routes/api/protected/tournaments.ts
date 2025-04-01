import { FastifyPluginAsync } from "fastify";
import { tournamentSchema } from "../../../model/jsonSchema";
import ServerRequestError from "../../../error/ServerRequestError";
import BadRequestError from "../../../error/BadRequestError";

import {
  getAllTournaments,
  getTournamentById,
  getTournamentParticipantsById,
  getTournamentGamesById,
  createTournament,
  updateTournament,
  registerForTournament,
  unregisterFromTournament,
  joinTournament,
  getAllParticipantsDetails
} from "../../../service/tournamentSvc";

// This is the route for the tournaments
const tournamentRoutes: FastifyPluginAsync = async (fastify, options) => {

  fastify.get('/',{
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
      const tournaments = await getAllTournaments(fastify);
      return tournaments;
    } catch (err: any) {
      fastify.log.error(err);
      reply.code(err.statusCode || 500).send({ error: err.message || 'Internal Server Error' });
    }
  });

  fastify.get<{
    Params: { id: number }
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
      const tournament = await getTournamentById(fastify, id);
      if (!tournament) {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      tournament.participants = await getTournamentParticipantsById(fastify, id);
      tournament.games = await getTournamentGamesById(fastify, id);
      return tournament;
    }
    catch (err: any) {
      fastify.log.error(err, `Error fetching tournament ${id}`);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      reply.code(statusCode).send({ error: message });
    }
  });

  fastify.post<{
    Body: {
      name: string
      description: string
      start_date: string
      end_date: string
    }
  }>('/', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'start_date', 'end_date'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' }
        }
      },
      response: {
        201: tournamentSchema
      }
    },
    errorHandler: (error, request, reply) => {
      if (error.validation)
      {
        fastify.log.error(`Validation error: ${JSON.stringify(error.validation)}`);
        let errorMessage = 'Validation error';
        if (error.validation.some(v => v.keyword === 'format' && v.params.format === 'date-time'))
        {
          errorMessage = 'Date format must be ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)';
          fastify.log.error(`Date format error in request: ${JSON.stringify(request.body)}`);
        }
        reply.code(400).send(
        {
          error: errorMessage,
          details: error.validation
        });
        return;
      }
      fastify.log.error(error, 'Error in POST /');
      reply.code(500).send({ error: 'An unexpected error occurred' });
    }
  }, async (request, reply) => {
    try {
      const { name, description, start_date, end_date } = request.body;
      fastify.log.info(`Creating tournament: ${JSON.stringify(request.body)}`);
      const tournament = await createTournament(fastify, name, description, start_date, end_date);
      reply.code(201).send(tournament);
    } catch (err: any) {
      fastify.log.error(err, `Error creating tournament`);
      if (err instanceof BadRequestError) {
        reply.code(400).send({ error: err.message });
      } else if (err instanceof ServerRequestError) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.code(500).send({ error: 'Internal Server Error while creating tournament' });
      }
    }
  });

  fastify.put<{
    Params: { id: number },
    Body: {
      name: string
      description: string
      start_date: string
      end_date: string
      status: string
    }
  }>('/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'description', 'start_date', 'end_date', 'status'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          start_date: { type: 'string', format: 'date-time' },
          end_date: { type: 'string', format: 'date-time' },
          status: { type: 'string' }
        }
      },
      response: {
        200: tournamentSchema
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, start_date, end_date, status } = request.body;
      const updatedTournament = await updateTournament(fastify, id, name, description, start_date, end_date, status);
      return updatedTournament;
    } catch (err: any) {
      fastify.log.error(err, `Error updating tournament ${request.params.id}`);
      if (err instanceof BadRequestError) {
        if (err.message.includes('Tournament not found')) {
          reply.code(404).send({ error: err.message });
        } else {
          reply.code(400).send({ error: err.message });
        }
      } else if (err instanceof ServerRequestError) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.code(500).send({ error: 'Internal Server Error while updating tournament' });
      }
    }
  });

  fastify.post<{
    Params: { id: number },
    Reply: {
      '4xx': { error: string },
      500: { error: string },
      201: { message?: string, participant?: any }
    }
  }>('/:id/register', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            participant: { /* Define participant schema if needed */ type: 'object' }
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } },
        500: { type: 'object', properties: { error: { type: 'string' } } },
      }
    }
  }, async (request, reply) => {
    try
    {
      const { id } = request.params;
      const user_id = request.userid;

      const participant = await registerForTournament(fastify, id, user_id);
      reply.code(201).send({ message: 'Successfully registered for tournament', participant });
    }
    catch (err: any)
    {
      fastify.log.error(err, `Error registering for tournament ${request.params.id}`);
      if (err instanceof BadRequestError) {
        if (err.message.includes('Tournament not found')) {
          reply.code(404).send({ error: err.message });
        } else if (err.message.includes('not open for registration')) {
          reply.code(400).send({ error: err.message });
        } else if (err.message.includes('Already registered')) {
          reply.code(409).send({ error: err.message });
        } else {
          reply.code(400).send({ error: err.message });
        }
      } else if (err instanceof ServerRequestError) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.code(500).send({ error: 'Internal Server Error while registering' });
      }
    }
  });

  fastify.delete<{
    Params: { id: number },
    Reply: {
      204: void,
      404: { error: string },
      500: { error: string },
    }
  }>('/:id/register', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        204: { description: 'No content' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        500: { type: 'object', properties: { error: { type: 'string' } } },
      }
    }
  }, async (request, reply) => {
    try
    {
      const { id } = request.params;
      const user_id = request.userid;

      await unregisterFromTournament(fastify, id, user_id);
      reply.code(204).send();
    }
    catch (err: any)
    {
      fastify.log.error(err, `Error unregistering from tournament ${request.params.id}`);
      if (err instanceof BadRequestError && err.message.includes('Tournament not found')) {
        reply.code(404).send({ error: err.message });
      } else if (err instanceof ServerRequestError) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.code(500).send({ error: 'Internal Server Error while unregistering' });
      }
    }
  });

  fastify.post<{
    Params: { id: number }
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
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' }, participant: { type: 'object', nullable: true } } },
        500: { type: 'object', properties: { error: { type: 'string' } } },
      }
    }
  }, async (request, reply) => {
    try
    {
      const { id } = request.params;
      const userId = request.userid;
      fastify.log.info(`User ${userId} attempting to join tournament ${id}`);

      fastify.log.info(`Calling joinTournament service for user ${userId}, tournament ${id}`);
      const participant = await joinTournament(fastify, id, userId);
      fastify.log.info(`User ${userId} successfully joined tournament ${id}`);
      return participant;
    }
    catch (err: any)
    {
      fastify.log.error(err, `Error joining tournament ${request.params.id}`);
      if (err instanceof BadRequestError) {
        if (err.message.includes('Tournament not found')) {
          reply.code(404).send({ error: err.message });
        } else if (err.message.includes('Already joined')) {
          reply.code(409).send({ error: err.message });
        } else {
          reply.code(400).send({ error: err.message });
        }
      } else if (err instanceof ServerRequestError) {
        reply.code(500).send({ error: err.message });
      } else {
        reply.code(500).send({ error: 'Internal Server Error while joining tournament' });
      }
    }
  });

  fastify.get<{
    Params: { id: number }
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
    try
    {
      const { id } = request.params;
      const tournament = await getTournamentById(fastify, id);
      if (!tournament)
        {
        reply.code(404).send({ error: 'Tournament not found' });
        return;
      }
      const participants = await getAllParticipantsDetails(fastify, id);
      return participants;
    }
    catch (err: any)
    {
      fastify.log.error(err, `Error fetching participants for tournament ${request.params.id}`);
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Internal Server Error';
      reply.code(statusCode).send({ error: message });
    }
  });
}

export default tournamentRoutes;