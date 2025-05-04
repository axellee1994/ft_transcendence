import { FastifyPluginAsync } from "fastify";
import { getMatchHistoryByID, getMatchHistoryFilter, getMatchStatByID } from "../../../service/matchSvc";
import { IMatchStat } from "../../../model/matchModel";

const matchHistoryRoutes : FastifyPluginAsync = async(fastify, options) => {
  // Get user's match history
  fastify.get<{
    Querystring?:{user_id : string}
  }>('/', async (request, reply) => {
      try {
          const userId = request.query?.user_id || request.userid;
          if (isNaN(+userId)) 
            return reply.code(400).send({ error: 'Invalid user ID' }); 
          fastify.log.info(`Fetching match history for user ${userId}`);
          const matches = await getMatchHistoryByID(fastify, +userId);
          fastify.log.info(`Found ${matches.length} match history records for user ${userId}`);
          return matches;
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get match history with filters
  fastify.get<{
    Querystring : {
      result ?: string,
      game_type ?: string,
      start_date ?: string,
      end_date ?: string,
      limit ?: number,
      offset ?: number
    }
  }>('/filter', async (request, reply) => {
    const { 
        result,
        game_type,
        start_date,
        end_date,
        limit = 20,
        offset = 0
    } = request.query;
    if (isNaN(+limit) || isNaN(+offset))
      return reply.code(400).send({ error: 'Invalid limit or offset' });
    if (limit < 0 || offset < 0)
      return reply.code(400).send({ error: 'Limit and offset must be non-negative' });
    try {
          const filterResult = await getMatchHistoryFilter(
            fastify,
            request.userid,
            result || "",
            game_type || "",
            start_date || "",
            end_date || "",
            +limit,
            +offset
          );
          return { matches: filterResult };
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get match statistics
  fastify.get<{
    Reply:{
      500 : {error:string},
      200 : IMatchStat
    }
  }>('/stats', async (request, reply) => {
    const defStat : IMatchStat = {
      total_matches: 0, 
      wins: 0, 
      losses: 0, 
      draws: 0,
      single_player_matches: 0,
      multiplayer_matches: 0,
      vs_ai_matches: 0,
      vs_player_matches: 0
    }
    try {
          const stats = await getMatchStatByID(fastify, request.userid) || defStat;
          return reply.code(200).send(stats);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });
}

export default matchHistoryRoutes;