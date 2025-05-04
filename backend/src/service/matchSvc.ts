import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import { IMatchHistory, IMatchStat } from "../model/matchModel";
import ServerRequestError from "../error/ServerRequestError";

export const getMatchHistoryByID = async(fastify:FastifyInstance, userid:number) =>{
  try {
    const matches = await fastify.db.all<IMatchHistory[]>(SQLStatement.HISTORY_MATCH_BY_ID, userid);
    return matches;
  } catch (error : unknown) {
    throw new ServerRequestError({message : "DB Error"});
  }
}

export const getMatchStatByID = async(fastify:FastifyInstance, userid:number) =>{
  try {
    const stats = await fastify.db.get<IMatchStat>(SQLStatement.HISTORY_MATCH_STAT_BY_ID, userid);
    return stats;
  } catch (error : unknown) {
    throw new ServerRequestError({message : "DB Error"});
  }
}

export const getMatchHistoryFilter = async(
  fastify:FastifyInstance,
  userid:number,
  result:string,
  game_type:string ,
  start:string,
  end :string,
  limit:number,
  offset:number
) =>{
  let query = SQLStatement.HISTORY_MATCH_FILTER;
  const params : string[] = [''+userid];
  if (result !="") {
    query += ' AND mh.result = ?';
    params.push(result);
  }

  if (game_type != "") {
      query += ' AND g.game_type = ?';
      params.push(game_type);
  }

  if (start != "") {
      query += ' AND mh.created_at >= ?';
      params.push(start);
  }

  if (end != "") {
      query += ' AND mh.created_at <= ?';
      params.push(end);
  }

  query += ' ORDER BY mh.created_at DESC LIMIT ? OFFSET ?';
  params.push(""+limit, ""+offset);

  try {
    const matches = await fastify.db.all<IMatchHistory[]>(query, params);    
    return (matches);
  } catch (error) {
    throw new ServerRequestError({message:"DB Error"});
  }
}