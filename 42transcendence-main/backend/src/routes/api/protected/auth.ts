import { FastifyPluginAsync } from "fastify";
import { errSchema, meSchema, okSchema } from "../../../model/jsonSchema";
import { Ime } from "../../../model/userModel";
import { getUserByID, setOnlineStatusByID } from "../../../service/userSvc";

const authSessionRoutes : FastifyPluginAsync = async(fastify, options) =>{

  // Get current user
  fastify.get<{
    Reply:{
      404 : {error : string},
      500 : {error : string},
      200 : Ime
    }
  }>('/me', {
    schema:{
      response:{
        200 : meSchema,
        404 : errSchema,
        500 : errSchema
      }
    }
  },async (request, reply) => {
      try {
          const user = await getUserByID(fastify, request.userid);
          if (!user) 
            return reply.code(404).send({error: 'User not found'});

          reply.code(200).send({
              id: user.id,
              username: user.username,
              email: user.email,
              avatar_url: user.avatar_url,
              wins: user.wins,
              losses: user.losses,
              is_2fa_enabled: Boolean(user.is_2fa_enabled),
              display_name : user.display_name,
              is_remote_user: Boolean(user.is_remote_user)
          });
      } catch (error) {
          fastify.log.error(error);
          reply.code(500).send({error: 'Error fetching user'});
      }
  });

  // Logout
  fastify.post<{
    Reply:{
      200 : {message:string},
      500 : {error :string}
    }
  }>('/logout',{
    schema:{
      response:{
        200 : okSchema,
        500 : errSchema
      }
    }
  } ,async (request, reply) => {
      try {
          await setOnlineStatusByID(fastify, request.userid, false);
          
          reply.code(200).send({ message: 'Logged out successfully' });
      } catch (error) {
          fastify.log.error(error);
          reply.code(500).send({ error: 'Error during logout' });
      }
  });
}

export default authSessionRoutes;