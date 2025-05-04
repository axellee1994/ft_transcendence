import { FastifyInstance } from "fastify"
import SQLStatement from "../SQLStatement"
import ServerRequestError from "../error/ServerRequestError";
import { IGetFriend, IpendingFriend } from "../model/friendModel";

export const getFriendsByID = async(fastify : FastifyInstance, userid:number) =>{
    try{
        const friends = await fastify.db.all<IGetFriend[]>(
            SQLStatement.FRIENDSHIP_GET_FRIENDS,
            [userid, userid, userid, userid]
          );
        return friends;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB error"});
    }
}

export const getPendingFriendsByID = async(fastify : FastifyInstance, userid: number) =>{
    try{
        const pending = await fastify.db.all<IpendingFriend[]>(
            SQLStatement.FRIENDSHIP_GET_PENDING, 
            userid
        );
        return pending;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB error"});
    }
}

export const isFriend = async(fastify: FastifyInstance, ownid:number, friendid:number) => {
    try{
        const existing = await fastify.db.get<string>(
            SQLStatement.FRIENDSHIP_GET_STATUS, 
            [ownid, friendid, friendid, ownid]
          );
        if (existing)
            return true;
        return false;
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB error"});
    }
}

export const sendFriendReq = async(fastify: FastifyInstance, ownid :number, friendid:number ) =>{
    try{
        await fastify.db.run(
            SQLStatement.FRIENDSHIP_INSERT_REQUEST,
            [ownid, friendid]
        );
    }
    catch(error :unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const getFriendStatusnID = async (fastify: FastifyInstance, ownid:number, friendid:number) =>{
    try {
        const friendship = await fastify.db.get<{id:number, status:string}>(
            SQLStatement.FRIENDSHIP_GET_FRIENDS_ID_STATUS, 
            [friendid, ownid]
        );
        return friendship;
    } catch (error) {
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const acceptFriendReq = async(fastify: FastifyInstance, friendid:number) =>{
    try{
        await fastify.db.run(SQLStatement.FRIENDSHIP_ACCEPT_FRIEND, friendid);
    }
    catch(error:unknown){
        throw new ServerRequestError({message:"DB Error"});
    }
}

export const deleteFriendReq = async(fastify: FastifyInstance, friendid:number) =>{
    try {
        await fastify.db.run(SQLStatement.FRIENDSHIP_DELETE_BY_ID, friendid);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const deleteFriend = async(fastify: FastifyInstance, ownid:number, friendid:number) =>{
    try {
        await fastify.db.run(SQLStatement.FRIENDSHIP_UNFRIEND, [ownid, friendid, friendid, ownid]);
    } catch (error) {
        throw new ServerRequestError({message : "DB Error"});
    }
}

export const getFriendshipStatusByUidOrFid = async(fastify:FastifyInstance, cid:number, uid:number) =>{
  const defVal = <{status:string|null, direction:string|null}>{status: null, direction: null};
  try {
    const friendship = await fastify.db.get<{status:string, direction:string}>(
      SQLStatement.FRIENDSHIP_GET_FRIEND_STATUS_BY_USERID_OR_FRIENDID,
      [cid, cid, cid, uid, uid, cid]
    );
    return friendship ||defVal;
  } catch (error) {
    throw new ServerRequestError({message : "DB Error"});
  }
}