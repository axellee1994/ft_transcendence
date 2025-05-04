import { FastifyPluginAsync } from "fastify"
import { UserJWTPayload } from "../../../model/userModel";
import friendRoutes from "./friends";
import gameRoutes from "./games";
import matchHistoryRoutes from "./match-history";
import userStatsRoutes from "./user-stats";
import authSessionRoutes from "./auth";
import userRoutes from "./user";
import tournamentRoutes from "./tournaments";
import { setOnlineStatusByID } from "../../../service/userSvc";

declare module 'fastify' {
  export interface FastifyRequest {
    userid: number;
  }
}

const authIndex: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.decorateRequest('userid',-1);

  fastify.addHook('preHandler', async (request, reply) => {
    if (!request.headers.authorization|| !request.headers.authorization.startsWith("Bearer "))
      return reply.code(401).send({msg:"unauthorized"});
    const token = request.headers.authorization.split(" ")[1];
    fastify.jwt.verify(token, (err, decoded:UserJWTPayload)=>{
      if (err)
        reply.code(401).send({msg:"ununauthorized"});
      request.userid = decoded.id;
      setOnlineStatusByID(fastify, decoded.id, true)
      .catch((error:unknown)=>{
        reply.code(500).send({error :"Server error"});
      });
    });
  });

  fastify.register(authSessionRoutes, {
    prefix : "/auth"
  });

  fastify.register(friendRoutes,{
    prefix : "/friends"
  });

  fastify.register(gameRoutes,{
    prefix : "/games"
  });

  fastify.register(matchHistoryRoutes,{
    prefix : "/match-history"
  });

  fastify.register(tournamentRoutes,{
    prefix : "/tournaments"
  });

  fastify.register(userStatsRoutes,{
    prefix : "/user-stats"
  });

  fastify.register(userRoutes,{
    prefix : "/users"
  });

}

export default authIndex;