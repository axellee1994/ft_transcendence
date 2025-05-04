import { FastifyPluginAsync } from "fastify";
import { errSchema, gameSchema } from "../../../model/jsonSchema";
import { IGame } from "../../../model/gamesModel";
import { getActiveGameforPlayer, getActiveGames, getGameById, getGames, insertCompletedGameRecord, insertGame, insertPlayerRecord, setGameStatusCompleted, updateGameByID, updatePlayerStats, upUserLose, upUserWin } from "../../../service/gameSvc";
import { updateTournamentMatchResult, getTournamentMatch, getTournamentNextRoundMatches, updateNextRoundMatchPlayer } from "../../../service/gameSvc";
import { updateTournamentStatus, updateTournamentWinner, getTournament } from "../../../service/tournamentSvc";


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

          if (updates.status === 'completed' && updates.winner_id) {
              await updatePlayerStats(fastify, updates.winner_id, true);
              
              const loserId = game.player1_id === updates.winner_id ? game.player2_id : game.player1_id;
              await updatePlayerStats(fastify, loserId, false);
              
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
      winner : string,
      tournamentMatchId: number,
      game_title?: string
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
                  winner: { type: 'string', enum: ['player1', 'player2'] },
                  tournamentMatchId: { type: ['number', 'null']},
                  game_title: { type: 'string', maxLength: 50 }
              }
          },
          response: {
              201: gameSchema,
              200: {}
          }
      }
  }, async (request, reply) => {
      try {
          fastify.log.info(`Received game results: ${JSON.stringify(request.body)}`);
          fastify.log.info(`User ID from token: ${request.userid}`);
          
          const { player1_score, player2_score, game_type, winner, tournamentMatchId, game_title } = request.body;
          fastify.log.info(`Received game_title from request body: [${game_title}]`);
          const player1_id = request.userid;
          
          let player2_id = -1;
          
          if (game_type === 'multi' && tournamentMatchId)
          {
            ;
          }
          else if (game_type === 'multi') {
              const activeGame = await getActiveGameforPlayer(fastify, player1_id, player1_id);
              if (activeGame) {
                  player2_id = activeGame.player1_id === player1_id ? activeGame.player2_id : activeGame.player1_id;
                  
                  await setGameStatusCompleted(fastify, activeGame.id);
              } else {
                  fastify.log.warn(`No active game found for player ${player1_id}`);
              }
          }

          if (game_type === 'multi' && tournamentMatchId)
          {
            const tournament_match = await getTournamentMatch(fastify, tournamentMatchId);
            if (!tournament_match) {
                fastify.log.error(`Tournament Match ${tournamentMatchId} not found when processing results.`);
                return reply.code(404).send({ error: "Tournament Match not found" });
            }
            
            if (tournament_match.winner_id !== null)
            {
                fastify.log.info(`cannot save match, already has a winner for this match`);
                reply.code(400).send({ error: 'Already has a winner for this match'});
                return;
            }

            let winner_id: number;
            if (player1_score > player2_score)
                winner_id = tournament_match.player1_id;
            else
                winner_id = tournament_match.player2_id;
            const loserId = (winner_id === tournament_match.player1_id) ? tournament_match.player2_id : tournament_match.player1_id;
            fastify.log.info(`Tournament Match ${tournamentMatchId} finished. Winner: ${winner_id}, Loser: ${loserId}`);

            const gameResult = await insertCompletedGameRecord(fastify, tournament_match.player1_id, tournament_match.player2_id, player1_score, player2_score, 'tournament', winner_id);
            const gameId = gameResult.lastID;
            fastify.log.info(`Tournament game record created with ID: ${gameId}`);
            const tournament = await getTournament(fastify, tournament_match.tournament_id);
            const tournamentName = (tournament && tournament.length > 0) ? tournament[0].name : 'Tournament Match';
            if (gameId)
            {
                await insertPlayerRecord(fastify, winner_id, gameId, loserId, 'win', tournamentName);
                await insertPlayerRecord(fastify, loserId, gameId, winner_id, 'loss', tournamentName);
                fastify.log.info(`Match history added for tournament match ${tournamentMatchId} using title: ${tournamentName}`);
            }

            await updateTournamentMatchResult(fastify, player1_score, player2_score, winner_id, tournamentMatchId);
            fastify.log.info(`Updated tournament_matches table for match ${tournamentMatchId}.`);

            await updatePlayerStats(fastify, winner_id, true);
            await updatePlayerStats(fastify, loserId, false);
            const tournament_matches = await getTournamentNextRoundMatches(fastify, (tournament_match.round + 1), tournament_match.tournament_id);
            if (tournament_matches.length > 0)
            {
                for (const match of tournament_matches) 
                {
                    if (match.player1_id === -1)
                    {
                        updateNextRoundMatchPlayer(fastify, winner_id, match.player2_id, match.id);
                        break;
                    }
                    if (match.player2_id === -1)
                    {
                        updateNextRoundMatchPlayer(fastify, match.player1_id, winner_id, match.id);
                        break;
                    }
                }
            }
            else
            {
                await updateTournamentWinner(fastify, winner_id, tournament_match.tournament_id);
                await updateTournamentStatus(fastify, 'completed', tournament_match.tournament_id);
            }
            reply.code(200).send({ message: "Tournament match result processed." });
            return;
          }
          else
          {
            const winner_id = winner === 'player1' ? player1_id : (player2_id > 0 ? player2_id : null);
            fastify.log.info(`Saving game with player1_id=${player1_id}, player2_id=${player2_id}, winner_id=${winner_id}`);
            
            const gameTypeForRecord = (tournamentMatchId) ? 'tournament' : game_type;
            const result = await insertCompletedGameRecord(fastify, player1_id, player2_id, player1_score, player2_score, gameTypeForRecord, winner_id);
            const gameId = result.lastID;
            fastify.log.info(`Game saved with ID: ${gameId}`);
            
            const game = await getGameById(fastify, gameId || -1);
            await insertPlayerRecord(fastify, player1_id, gameId || -1, player2_id > 0 ? player2_id : null, winner === 'player1' ? 'win' : 'loss', game_title || null);
            fastify.log.info(`Match history added for player1`);
            if (player2_id > 0)
            {
                await insertPlayerRecord(fastify, player2_id, gameId || -1, player1_id, winner === 'player2' ? 'win' : 'loss', game_title || null);
                fastify.log.info(`Match history added for player2`);
            }
            await updatePlayerStats(fastify, player1_id, winner_id === player1_id);
            if (player2_id > 0)
                await updatePlayerStats(fastify, player2_id, winner_id === player2_id);
            fastify.log.info(`Game results recorded: ${JSON.stringify(game)}`);
            reply.code(201);
            return game;
        }
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