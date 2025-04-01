import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import { IGame } from "../model/gamesModel";
import ServerRequestError from "../error/ServerRequestError";
import { updateUserStats as updateUserStatsSvc } from "./userStatsSvc";

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


export const insertPlayerRecord = async(fastify:FastifyInstance, p1id:number, gid:number, p2id:number|null, result:string) => {
    if (gid == -1)
        return;
    try {
        await fastify.db.run(SQLStatement.GAME_INSERT_PLAYER_RECORD, [p1id, gid, p2id, result]);
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


// Helper function to update player stats using the userStatsSvc
export async function updatePlayerStats(fastifyInstance : FastifyInstance, playerId : number, isWinner:boolean) {
    try {
        // Prepare the payload for userStatsSvc.updateUserStats
        const updates = {
            games_played: 1, // Always increment games_played
            games_won: isWinner ? 1 : 0 // Increment games_won if they are the winner
        };

        // Call the service function to update/create stats
        // Note: This assumes updateUserStatsSvc increments values if they exist.
        // If it overwrites, the logic here or in updateUserStatsSvc needs adjustment.
        await updateUserStatsSvc(fastifyInstance.db, playerId, updates);
        
    } catch (err: unknown) {
      if (err instanceof Error)
        fastifyInstance.log.error(`Error updating player stats for user ${playerId}: ${err.message}`);
        // Don't throw so that the main transaction can still complete
    }
} 