import { FastifyPluginAsync } from "fastify";
import { userStatsSchema } from "../../../model/jsonSchema";
import * as userStatsSvc from "../../../service/userStatsSvc";
import ServerRequestError from "../../../error/ServerRequestError";
import BadRequestError from "../../../error/BadRequestError";

// Define interface for update payload consistency
interface UserStatsUpdatePayload {
    games_played?: number;
    games_won?: number;
    highest_score?: number;
    fastest_win_seconds?: number | null;
    longest_game_seconds?: number | null;
}

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
            // Use request.userid as confirmed by the auth hook
            const userId = request.userid; // populated by auth hook
            if (!userId && userId !== 0) { // Check for undefined, null, or potentially other non-numeric values. Allow 0.
                 throw new BadRequestError({ message: 'User ID not found in request.' });
            }
            // No longer need parseInt if the hook assigns a number
            const stats = await userStatsSvc.getUserStats(fastify.db, userId);
            return stats;
        } catch (err) {
            fastify.log.error(err);
             if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                 reply.code(err.statusCode).send({ error: err.errors[0].message }); // Use the error message from custom errors
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
                404: { type: 'object', properties: { error: { type: 'string' } } } // Add 404 response schema
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // Use getUserStats which handles the not found case by throwing an error
            const stats = await userStatsSvc.getUserStats(fastify.db, id);
            return stats;
        } catch (err) {
            fastify.log.error(err);
            if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                // Check if the error message indicates "not found" or similar
                // This depends on the specific error message thrown by getUserStats
                if (err.message.includes('find stats')) { // A bit fragile, might need refinement
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
    fastify.put<{ Params: { userId: number }, Body: UserStatsUpdatePayload }>('/:userId', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    userId: { type: 'integer' }
                }
            },
            body: { // Define schema based on UserStatsUpdatePayload
                type: 'object',
                properties: {
                    games_played: { type: 'integer' },
                    games_won: { type: 'integer' },
                    highest_score: { type: ['integer', 'null'] }, // Ensure schema matches interface
                    fastest_win_seconds: { type: ['integer', 'null'] },
                    longest_game_seconds: { type: ['integer', 'null'] }
                },
                // Mark properties as optional if needed, based on `updates` logic
                 additionalProperties: false // Prevent unexpected properties
            },
             response: {
                 200: userStatsSchema // Return updated stats
             }
        }
    }, async (request, reply) => {
        try {
            const { userId } = request.params;
            const updates: UserStatsUpdatePayload = request.body;

             // Basic validation: Ensure at least one field is provided for update?
             // Or rely on the service logic to handle empty updates gracefully.

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