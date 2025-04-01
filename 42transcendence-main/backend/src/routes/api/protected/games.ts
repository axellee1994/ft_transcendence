import { FastifyPluginAsync } from "fastify";
import { errSchema, gameSchema } from "../../../model/jsonSchema";
import { IGame } from "../../../model/gamesModel";
import { getActiveGameforPlayer, getActiveGames, getGameById, getGames, insertCompletedGameRecord, insertGame, insertPlayerRecord, setGameStatusCompleted, updateGameByID, updatePlayerStats, upUserLose, upUserWin } from "../../../service/gameSvc";

const gameRoutes :FastifyPluginAsync = async(fastify, options) => {

  // Get all games
  fastify.get<{
    Reply:{
      200 : IGame[],
      500 : {error : string}
    }
  }>('/', {
      schema: {
          response: {
              200: {
                  type: 'array',
                  items: gameSchema
              },
              500 :errSchema
          }
      }
  }, async (request, reply) => {
      try {
          const games = await getGames(fastify);
          return reply.code(200).send(games);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Create new game
  fastify.post<{
    Body: {
      player1_id : number,
      player2_id : number,
      game_type : string
    },
    Reply:{
      500 : { error : string },
      201 : IGame
    }
  }>('/', {
      schema: {
          body: {
              type: 'object',
              required: ['player1_id', 'game_type'],
              properties: {
                  player1_id: { type: 'integer' },
                  player2_id: { type: 'integer' },
                  game_type: { type: 'string', enum: ['single', 'multi'] }
              }
          },
          response: {
              201: gameSchema,
              500 : errSchema
          }
      }
  }, async (request, reply) => {
      try {
          const result = await insertGame(fastify, request.body.player1_id, request.body.player2_id, request.body.game_type, 'pending');
          const game = await getGameById(fastify, result.lastID || -1);
          if (!game)
            return reply.code(500).send({error : "game not created"});
          reply.code(201).send(game);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get game by ID
  fastify.get<{
    Params : {id :number},
    Reply:{
      200 : IGame
      404: {error:string}
      500: {error:string}
    }
  }>('/:id', {
      schema: {
          params: {
              type: 'object',
              properties: {
                  id: { type: 'integer' }
              }
          },
          response: {
              200: gameSchema,
              404: errSchema,
              500: errSchema
          }
      }
  }, async (request, reply) => {
      try {
          const { id } = request.params;
          const game = await getGameById(fastify, id);
          if (!game) {
              reply.code(404).send({ error: 'Game not found' });
              return;
          }
          return reply.code(200).send(game);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Update game state
  fastify.put<{
    Params:{ id : number},
    Body:{
      player1_score : number,
      player2_score : number,
      status : string,
      winner_id : number
    }, Reply:{
      200 : IGame  
      404 : {error : string},
      500 : {error : string}
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
              properties: {
                  player1_score: { type: 'integer' },
                  player2_score: { type: 'integer' },
                  status: { type: 'string', enum: ['pending', 'active', 'completed'] },
                  winner_id: { type: 'integer' }
              }
          },
          response: {
              200: gameSchema,
              404 : errSchema,
              500 : errSchema
          }
      }
  }, async (request, reply) => {
      try {
          const { id } = request.params;
          const updates = request.body;
          
          await updateGameByID(fastify, updates.player1_score, updates.player2_score, updates.status, updates.winner_id, id);
          
          const game = await getGameById(fastify, id);
          if (!game) {
              reply.code(404).send({ error: 'Game not found' });
              return;
          }

          // If game is completed, update player stats
          if (updates.status === 'completed' && updates.winner_id) {
              // Update winner stats
              await updatePlayerStats(fastify, updates.winner_id, true);
              
              // Update loser stats
              const loserId = game.player1_id === updates.winner_id ? game.player2_id : game.player1_id;
              await updatePlayerStats(fastify, loserId, false);
              
              // Keep the existing users table updates for backward compatibility
              await upUserWin(fastify, updates.winner_id);
              await upUserLose(fastify, loserId);
          }
          
          return reply.code(200).send(game);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get active games
  fastify.get<{
    Reply:{
        200 : IGame[],
        500 : {error : string}
    }
  }>('/active', {
      schema: {
          response: {
              200: {
                  type: 'array',
                  items: gameSchema
              }
          }
      }
  }, async (request, reply) => {
      try {
          const games = await getActiveGames(fastify);
          return reply.code(200).send(games);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });


  // Record game results for the current user
  fastify.post<{
    Body:{
      player1_score : number,
      player2_score : number,
      game_type : string,
      winner : string
    }
  }>('/results', {
      schema: {
          body: {
              type: 'object',
              required: ['player1_score', 'player2_score', 'game_type', 'winner'],
              properties: {
                  player1_score: { type: 'integer' },
                  player2_score: { type: 'integer' },
                  game_type: { type: 'string', enum: ['single', 'multi'] },
                  winner: { type: 'string', enum: ['player1', 'player2'] }
              }
          },
          response: {
              201: gameSchema
          }
      }
  }, async (request, reply) => {
      try {
          fastify.log.info(`Received game results: ${JSON.stringify(request.body)}`);
          fastify.log.info(`User ID from token: ${request.userid}`);
          
          const { player1_score, player2_score, game_type, winner } = request.body;
          const player1_id = request.userid;
          
          let player2_id = -1; // Default to AI for single-player games
          
          if (game_type === 'multi') {
              // For multiplayer games, get the active game for this player
              const activeGame = await getActiveGameforPlayer(fastify, player1_id, player1_id);
              if (activeGame) {
                  // Set player2_id based on the active game
                  player2_id = activeGame.player1_id === player1_id ? activeGame.player2_id : activeGame.player1_id;
                  
                  // Update the game status to completed
                  await setGameStatusCompleted(fastify, activeGame.id);
              } else {
                  fastify.log.warn(`No active game found for player ${player1_id}`);
              }
          }
          
          const winner_id = winner === 'player1' ? player1_id : (player2_id > 0 ? player2_id : null);
          
          fastify.log.info(`Saving game with player1_id=${player1_id}, player2_id=${player2_id}, winner_id=${winner_id}`);
          
          // Insert the game record
          const result = await insertCompletedGameRecord(fastify, player1_id, player2_id, player1_score, player2_score, game_type, winner_id);
          const gameId = result.lastID;
          fastify.log.info(`Game saved with ID: ${gameId}`);
          
          // Get the inserted game
          const game = await getGameById(fastify, gameId || -1);
          
          // Add to match history for player 1
          await insertPlayerRecord(fastify, player1_id, gameId || -1, player2_id > 0 ? player2_id : null, winner === 'player1' ? 'win' : 'loss');
          
          fastify.log.info(`Match history added for player1`);
          
          // If player2 is a real user (not AI), add to their history too
          if (player2_id > 0) {
              await insertPlayerRecord(fastify, player2_id, gameId || -1, player1_id, winner === 'player2' ? 'win' : 'loss');
              fastify.log.info(`Match history added for player2`);
          }
          
          // Update player stats
          await updatePlayerStats(fastify, player1_id, winner_id === player1_id);
          
          if (player2_id > 0) {
              await updatePlayerStats(fastify, player2_id, winner_id === player2_id);
          }
          
          fastify.log.info(`Game results recorded: ${JSON.stringify(game)}`);
          reply.code(201);
          return game;
      } catch (err : unknown) {
        if (err instanceof Error){
          fastify.log.error(`Error saving game results: ${err.message}`);
          fastify.log.error(err.stack);
          reply.code(500).send({ error: 'Internal Server Error', details: err.message });
        }
        else
          reply.code(500).send({ error: 'Internal Server Error'});
      }
  });
}


export default gameRoutes;