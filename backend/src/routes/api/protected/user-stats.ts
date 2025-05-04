import { FastifyPluginAsync } from "fastify";
import { userStatsSchema } from "../../../model/jsonSchema";
import * as userStatsSvc from "../../../service/userStatsSvc";
import ServerRequestError from "../../../error/ServerRequestError";
import BadRequestError from "../../../error/BadRequestError";
import { IUserStatsUpdatePayload } from "../../../model/userStatModel";

const userStatsRoutes: FastifyPluginAsync = async (fastify, options) => {

    // Get stats for current authenticated user
    fastify.get('/me', {
        schema: {
            response: {
                200: userStatsSchema
            }
        }
    }, async (request, reply) => {
        try {
            const userId = request.userid;
            if (!userId && userId !== 0) {
                 throw new BadRequestError({ message: 'User ID not found in request.' });
            }
            const stats = await userStatsSvc.getUserStats(fastify.db, userId);
            return stats;
        } catch (err) {
            fastify.log.error(err);
             if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                 reply.code(err.statusCode).send({ error: err.errors[0].message });
             } else {
                 reply.code(500).send({ error: 'Internal Server Error' });
             }
        }
    });

    // Get stats for specific user
    fastify.get<{ Params: { id: number } }>('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: userStatsSchema,
                404: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const stats = await userStatsSvc.getUserStats(fastify.db, id);
            return stats;
        } catch (err) {
            fastify.log.error(err);
            if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                if (err.message.includes('find stats')) {
                    reply.code(404).send({ error: 'User stats not found' });
                } else {
                    reply.code(err.statusCode).send({ error: err.errors[0].message });
                }
            } else {
                reply.code(500).send({ error: 'Internal Server Error' });
            }
        }
    });

    // Update user stats (used when game is completed)
    fastify.put<{ Params: { userId: number }, Body: IUserStatsUpdatePayload }>('/:userId', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    games_played: { type: 'integer' },
                    games_won: { type: 'integer' },
                    highest_score: { type: ['integer', 'null'] },
                    fastest_win_seconds: { type: ['integer', 'null'] },
                    longest_game_seconds: { type: ['integer', 'null'] }
                },
                 additionalProperties: false
            },
             response: {
                 200: userStatsSchema
             }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const updates: IUserStatsUpdatePayload = request.body;
            const updatedStats = await userStatsSvc.updateUserStats(fastify.db, userId, updates);
            return updatedStats;
        } catch (err) {
            fastify.log.error(err);
            if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                reply.code(err.statusCode).send({ error: err.errors[0].message });
            } else {
                reply.code(500).send({ error: 'Internal Server Error' });
            }
        }
    });
}

export default userStatsRoutes;