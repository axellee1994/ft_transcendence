import { FastifyPluginAsync } from "fastify";
import SQLStatement from "../../../SQLStatement";
import { getUserStats } from "../../../service/userStatsSvc";


const matchHistoryRoutes : FastifyPluginAsync = async(fastify, options) => {
  // Get user's match history
  fastify.get<{
    Querystring?:{user_id : string}
  }>('/', async (request, reply) => {
      try {
          // Use query parameter user_id if provided, otherwise use the authenticated user's ID
          const userId = request.query?.user_id || request.userid;
          
          fastify.log.info(`Fetching match history for user ${userId}`);
          
          const matches = await fastify.db.all(SQLStatement.HISTORY_MATCH_BY_ID, userId);
          
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
      result : string,
      game_type : string,
      start_date : string,
      end_date : string,
      limit : number,
      offset : number
    }
  }>('/filter', async (request, reply) => {
      try {
          const { 
              result, 
              game_type, 
              start_date, 
              end_date,
              limit = 20,
              offset = 0
          } = request.query;
          
          let query = `
              SELECT 
                  mh.id,
                  mh.result,
                  mh.created_at as match_date,
                  g.player1_score,
                  g.player2_score,
                  g.game_type,
                  CASE 
                      WHEN mh.opponent_id IS NULL THEN 'AI'
                      ELSE u.username 
                  END as opponent_username,
                  CASE 
                      WHEN mh.opponent_id IS NULL THEN 'AI'
                      ELSE u.display_name 
                  END as opponent_display_name,
                  CASE 
                      WHEN mh.opponent_id IS NULL THEN '/assets/images/ai-avatar.png'
                      ELSE u.avatar_url 
                  END as opponent_avatar
              FROM match_history mh
              JOIN games g ON mh.game_id = g.id
              LEFT JOIN users u ON mh.opponent_id = u.id
              WHERE mh.user_id = ?
          `;
          
          const params : string[] = [''+request.userid];
          
          if (result) {
              query += ' AND mh.result = ?';
              params.push(result);
          }
          
          if (game_type) {
              query += ' AND g.game_type = ?';
              params.push(game_type);
          }
          
          if (start_date) {
              query += ' AND mh.created_at >= ?';
              params.push(start_date);
          }
          
          if (end_date) {
              query += ' AND mh.created_at <= ?';
              params.push(end_date);
          }
          
          query += ' ORDER BY mh.created_at DESC LIMIT ? OFFSET ?';
          params.push(""+limit, ""+offset);
          
          const matches = await fastify.db.all(query, params);
          
          // Get total count for pagination
          const countQuery = query
              .replace('SELECT *', 'SELECT COUNT(*) as total')
              .split('ORDER BY')[0]
              .replace('LIMIT ? OFFSET ?', '');
          
          // Safely get total count, providing a default if no rows are found
          const countResult = await fastify.db.get<{ total: number }>(countQuery, params.slice(0, -2));
          const total = countResult?.total ?? 0;
          
          return {
              matches,
              total,
              limit,
              offset
          };
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get match statistics - Now using userStatsSvc
  fastify.get('/stats', async (request, reply) => {
      try {
          // 1. Fetch aggregated stats from userStatsSvc
          const aggregatedStats = await getUserStats(fastify.db, request.userid);
          
          // 2. Fetch game type counts
          const gameTypeCountsResult = await fastify.db.all<{ game_type: string, count: number }[]>(
              SQLStatement.HISTORY_GET_GAME_TYPE_COUNTS, 
              request.userid
          );

          // Process game type counts into a simpler object
          const gameTypeCounts = {
              single: 0,
              multi: 0,
              tournament: 0 // Include tournament if relevant
          };
          gameTypeCountsResult.forEach(row => {
              if (row.game_type === 'single') gameTypeCounts.single = row.count;
              if (row.game_type === 'multi') gameTypeCounts.multi = row.count;
              if (row.game_type === 'tournament') gameTypeCounts.tournament = row.count; // Handle tournament type if needed
          });
          
          // 3. Combine results
          const combinedStats = {
              ...aggregatedStats,
              gameTypeCounts: gameTypeCounts
          };
          
          // Return the combined object
          return combinedStats;

      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error retrieving stats' });
      }
  });
}

export default matchHistoryRoutes;