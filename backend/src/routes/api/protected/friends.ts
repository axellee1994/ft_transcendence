import { FastifyPluginAsync } from "fastify";
import { getUserByID } from "../../../service/userSvc";
import { acceptFriendReq, deleteFriend, deleteFriendReq, getFriendsByID, getFriendStatusnID, getPendingFriendsByID, isFriend, sendFriendReq } from "../../../service/friendSvc";
import { IGetFriend, IpendingFriend } from "../../../model/friendModel";

const friendRoutes:FastifyPluginAsync = async(fastify, options) =>{

  // Get user's friends
  fastify.get<{
    Reply:{
        200 : IGetFriend[],
        500 : {error: string}
    }}>('/', async (request, reply) => {
      try {
          const friends = await getFriendsByID(fastify, request.userid);
          return reply.code(200).send(friends);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get pending friend requests
  fastify.get<{
    Reply:{
        200 : IpendingFriend[],
        500 : {error : string}
    }
  }>('/pending', async (request, reply) => {
      try {
          const pending = await getPendingFriendsByID(fastify, request.userid);
          return reply.code(200).send(pending);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Send friend request
  fastify.post<{
    Params:{userId:number},
    Reply:{
      201 : { message : string},
      404 : { error : string },
      409 : { error : string },
      500 : { error : string }
    }
  }>('/:userId', async (request, reply) => {
      try {
          const { userId } = request.params;
          const user = await getUserByID(fastify, userId);
          if (!user) {
              reply.code(404).send({ error: 'User not found' });
              return;
          }
          const existing = await isFriend(fastify, request.userid, userId);
          if (existing) {
              reply.code(409).send({ error: 'Friendship already exists' });
              return;
          }
          
          await sendFriendReq(fastify, request.userid, userId);
          reply.code(201).send({ message: 'Friend request sent' });
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Accept friend request
  fastify.put<{
    Params:{userId:number},
    Reply:{
      200 : {message:string},
      400 : {error: string},
      404 : {error: string},
      500 : {error: string}
    }
  }>('/:userId/accept', async (request, reply) => {
      const { userId } = request.params;
      try {
          const friendship = await getFriendStatusnID(fastify, request.userid, userId);
          if (!friendship) {
              reply.code(404).send({ error: 'Friend request not found' });
              return;
          }
          if (friendship.status !== 'pending') {
              reply.code(400).send({ error: 'Invalid friend request status' });
              return;
          }
          await acceptFriendReq(fastify, friendship.id);
          reply.code(200).send({ message: 'Friend request accepted' });
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Reject friend request
  fastify.put<{
    Params:{userId:number},
    Reply:{
      200 : {message:string},
      400 : {error: string},
      404 : {error: string},
      500 : {error: string}
    }
  }>('/:userId/reject', async (request, reply) => {
      try {
          const { userId } = request.params;
          const friendship = await getFriendStatusnID(fastify, request.userid, userId);
          if (!friendship) {
              reply.code(404).send({ error: 'Friend request not found' });
              return;
          }
          if (friendship.status !== 'pending') {
              reply.code(400).send({ error: 'Invalid friend request status' });
              return;
          }
          await deleteFriendReq(fastify, friendship.id);
          reply.code(200).send({ message: 'Friend request rejected' });
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Remove friend
  fastify.delete<{
    Params:{userId:number},
    Reply:{
      204 : void
      400 : {error : string}
      500 : {error : string}
    }
  
  }>('/:userId', async (request, reply) => {
      try {
          const { userId } = request.params;
          const exist = await isFriend(fastify, request.userid, userId);
          if (!exist)
              return reply.code(400).send({error: "bad request"});
          await deleteFriend(fastify, request.userid, userId);
          reply.code(204).send();
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });
}

export default friendRoutes;