import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import { Estatus, ITournament } from "../model/tournamentModel";
import ServerRequestError from "../error/ServerRequestError";

export const getAllTmt = async(fastify:FastifyInstance) => {
  try {
    const tournaments = await fastify.db.all<ITournament[]>(SQLStatement.TMT_GET_ALL_TOURNA);
    return tournaments;
  } catch (error) {
    throw new ServerRequestError({message : "DB Error"});
  }
}

export const getTmtbyID = async(fastify:FastifyInstance, tid : number) => {
  try {
    const tournament = await fastify.db.get<ITournament>(SQLStatement.TMT_GET_TOURNA_BY_ID, tid);
    return tournament
  } catch (error) {
    throw new ServerRequestError({message : "DB Error"});
  }
}

export const setTMTbyID = async(fastify:FastifyInstance, name:string, description:string, start:string, end : string, status:Estatus, id : number) => {
  try {
    await fastify.db.run(
      SQLStatement.TMT_UPDATE_TOURNA,
      [name, description, start, end, status, id]
    );
  } catch (error) {
    throw new ServerRequestError({message : "DB Error"});
  }
}

export const rmPptfromTMT = async(fastify:FastifyInstance, tid: number, pid:number) =>{
  try {
    await fastify.db.run(SQLStatement.TMT_DELETE_PLAYER_FROM_PARTICIPANT, [tid, pid]);
  } catch (error) {
    throw new ServerRequestError({message: "DB Error"});
  }
}

export const addPptToTMT = async(fastify:FastifyInstance, tid: number, pid:number) =>{
  try {
    const result = await fastify.db.run(SQLStatement.TMT_INSERT_PARTICIPANT_INTO_TOURNA, [tid, pid]);
    return result;
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}


export const getTournamentParticipants = async(fastify:FastifyInstance, tourid:number) =>
{
    try
    {
        const participants = await fastify.db.all(SQLStatement.TMT_GET_ALL_PLAYERS_IN_TOURNA, tourid);
        return participants;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const createTournamentMatch = async(fastify : FastifyInstance, player1_id : number, player2_id : number, round: number, match_code: number, tourid:number) =>
{
    try
    {
        await fastify.db.run(SQLStatement.TOURNA_INSERT_TOURNA_MATCH, [tourid, player1_id, player2_id, round, match_code]);
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"Server error"});
    }
}

export const updateTournamentStatus = async(fastify : FastifyInstance, status: string, tourid: number) =>
{
    try
    {
        await fastify.db.run(SQLStatement.TOURNA_UPDATE_TOURNA_STATUS, [status, tourid]);
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"Server error"});
    }
}

export const getTournamentMatches = async(fastify:FastifyInstance, tourid:number) =>
{
    try
    {
        const matches = await fastify.db.all(SQLStatement.TOURNA_GET_ALL_MATCHES, tourid);
        return matches;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const updateTournamentWinner = async(fastify : FastifyInstance, winner_id:number, tourid: number) =>
{
    try
    {
        await fastify.db.run(SQLStatement.TOURNA_UPDATE_TOURNA_WINNER, [winner_id, tourid]);
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"Server error"});
    }
}

export const getTournament = async(fastify:FastifyInstance, tourid:number) =>
{
    try
    {
        const tournament = await fastify.db.all(SQLStatement.TMT_GET_TOURNA_BY_ID, tourid);
        return tournament;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const isUniqueTournamentName = async(fastify : FastifyInstance, name : string): Promise<boolean> =>{
  try 
  {
    const row = await fastify.db.get<{ count: number }>(SQLStatement.TOURNA_GET_NAME_COUNT, name);
    const count = row?.count ?? 0;
    if (count > 0)
      return (false);
    else
      return (true);
  } catch (error)
  {
    throw new ServerRequestError({message:"DB Error"});
  }
}