import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import { IGame } from "../model/gamesModel";
import ServerRequestError from "../error/ServerRequestError";

export const getGames = async(fastify : FastifyInstance) => {
    try {
        const games = await fastify.db.all<IGame[]>(SQLStatement.GAME_GET_GAMES);
        return games;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const getGameById = async(fastify:FastifyInstance, gid : number ) => {
    try {
        const game = await fastify.db.get<IGame>(SQLStatement.GAME_GET_GAME_BY_ID, gid);
        return game;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const getActiveGames = async(fastify:FastifyInstance) =>{
    try {
        const games = await fastify.db.all<IGame[]>(SQLStatement.GAME_GET_ACTIVE_GAME);
        return games;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const updateGameByID = async(fastify:FastifyInstance, p1Score:number, p2Score:number, status:string, wId:number, gId:number) =>{
    try {
        await fastify.db.run(
            SQLStatement.GAME_UPDATE_GAME_BY_ID,
            [p1Score, p2Score, status, wId, gId]
        );
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const setGameStatusCompleted = async(fastify:FastifyInstance, gId:number) =>{
    try {
        await fastify.db.run(SQLStatement.GAME_UPDATE_COMPLETED_GAME, [gId]);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const insertGame = async(fastify:FastifyInstance, p1Id:number, p2Id:number, game_type:string, status:string) =>{
    try {
        const result = await fastify.db.run(
            SQLStatement.GAME_INSERT_GAME,
            [p1Id, p2Id, game_type, status]
          );
        return result;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const upUserWin = async(fastify:FastifyInstance, wid:number) =>{
    try {
        await fastify.db.run(SQLStatement.GAME_UPDATE_WIN, wid);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const upUserLose = async(fastify : FastifyInstance, loserId:number) =>{
    try {
        await fastify.db.run(SQLStatement.GAME_UPDATE_LOSS, loserId);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}


export const getActiveGameforPlayer = async(fastify:FastifyInstance, p1Id : number, p2Id : number) => {
    try {
        const activeGame = await fastify.db.get<IGame>(
            SQLStatement.GAME_GET_ACTIVE_GAME_FOR_PLAYER,
            [p1Id, p2Id]
        );
        return activeGame;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}


export const insertPlayerRecord = async(fastify:FastifyInstance, p1id:number, gid:number, p2id:number|null, result:string, game_title: string | null) => {
    if (gid == -1)
        return;
    try {
        fastify.log.info(`Inserting into match_history: user=${p1id}, game=${gid}, opponent=${p2id}, result=${result}, title=[${game_title}]`);
        await fastify.db.run(SQLStatement.GAME_INSERT_PLAYER_RECORD, [p1id, gid, p2id, result, game_title]);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}


export const insertCompletedGameRecord = async(fastify:FastifyInstance, p1id:number, p2id:number, p1score:number, p2score:number, game_type:string, wid:number|null) =>{
    try {
        const result = await fastify.db.run(
            SQLStatement.GAME_INSERT_GAME_RECORD, 
            [p1id, p2id, p1score, p2score, game_type, wid]
        );
        return result;
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}


// Helper function to update player stats
export async function updatePlayerStats(fastifyInstance : FastifyInstance, playerId : number, isWinner:boolean) {
    try {
        const stats = await fastifyInstance.db.get(SQLStatement.GAME_PLAYED_WON_BY_ID, playerId);
        
        if (stats) {
            await fastifyInstance.db.run(SQLStatement.GAME_UPDATE_USER_STAT, [isWinner ? 1 : 0, playerId]);
        } else {
            await fastifyInstance.db.run(SQLStatement.GAME_CREATE_USER_STAT, [playerId, isWinner ? 1 : 0]);
        }
    } catch (err: unknown) {
      if (err instanceof Error)
        fastifyInstance.log.error(`Error updating player stats: ${err.message}`);
    }
  } 


export const getGamesHistoryByUserID = async(fastify : FastifyInstance, userid:number) =>{
  try {
    const matches = await fastify.db.all<IGame[]>(SQLStatement.GAME_GET_GAME_HIST_USERID, [userid, userid]);
    return matches;
  } catch (error) {
    throw new ServerRequestError({message : "DB Error"});
  }
}


export const updateTournamentMatchResult = async(fastify : FastifyInstance, player1_score:number, player2_score:number, winner_id:number, tournamentMatchId:number) =>
{
    try 
    {
        await fastify.db.run(SQLStatement.TOURNA_UPDATE_MATCH_RESULT, player1_score, player2_score, winner_id, tournamentMatchId);
    } 
    catch (error) 
    {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const getTournamentMatch = async (fastify:FastifyInstance, tournamentMatchId:number) =>
{
    try
    {
        return await fastify.db.get(SQLStatement.TOURNA_GET_MATCH, tournamentMatchId);
    }
    catch(error:unknown)
    {
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const getTournamentNextRoundMatches = async(fastify:FastifyInstance, round: number, tournamentId:number) =>
{
    try
    {
        const matches = await fastify.db.all(SQLStatement.TOURNA_NEXT_ROUND_MATCHES, round, tournamentId);
        return matches;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const updateNextRoundMatchPlayer = async(fastify : FastifyInstance, player1_id:number, player2_id:number, tournamentMatchId:number) =>
{
    try 
    {
        await fastify.db.run(SQLStatement.TOURNA_UPDATE_NEXT_ROUND_PLAYER, player1_id, player2_id, tournamentMatchId);
    } 
    catch (error) 
    {
        throw new ServerRequestError({message : "DB Error"});
    }
}