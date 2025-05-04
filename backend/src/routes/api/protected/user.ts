import { FastifyPluginAsync } from 'fastify';
import { userSchema, errSchema, userStatsSchema, userOnlineStatusSchema, gameSchema, userOnlineStatusByUsernameOrDisplayNameSchema } from '../../../model/jsonSchema';
import { hashPW, verifyPW } from '../../../service/authSvc';
import { CustomError } from '../../../error/CustomError';
import { getBase64ImgSize, getUserByID, isValidImg, setUserAvatar, setUserDisplayName, setUserEmail, setUserPWHash, setUserUserName, setUserTwofa, getAllUser, getUserOnlineStatus, getUserOnlineStatusByUsernameOrDisplayName } from '../../../service/userSvc';
import ConstantsPong from '../../../ConstantsPong';
import { Iuser, IUserOnlineStatus, IUserSearchOnlineStatus } from '../../../model/userModel';
import { getUserStats } from '../../../service/userStatsSvc';
import { IUserStats } from '../../../model/userStatModel';
import { getGamesHistoryByUserID } from '../../../service/gameSvc';
import { IGame } from '../../../model/gamesModel';
import { getFriendshipStatusByUidOrFid } from '../../../service/friendSvc';
import { isUniqueDisplayName, isUniqueUserName, isUniqueEmail } from '../../../service/userSvc';


const userRoutes : FastifyPluginAsync = async (fastify, options) => {

  // Get all users
  fastify.get<{
    Reply:{
      200 : Iuser[],
      500 : {error : string}
    }
  }>('/', {
      schema: {
          response: {
              200: {
                  type: 'array',
                  items: userSchema
              }
          }
      }
  }, async (request, reply) => {
      try {
          const users = await getAllUser(fastify);
          return reply.code(200).send(users);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Get user by ID
  fastify.get<{
    Params : {id : string}
    Reply:{
      200:Iuser,
      404:{error:string},
      500:{error:string},
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
              200: userSchema
          }
      }
  }, async (request, reply) => {
      try {
          const { id } = request.params;
          const user = await getUserByID(fastify, +id);
          if (!user)
              return reply.code(404).send({ error: 'User not found' });
          return reply.code(200).send(user);
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

    // Get user stats
    fastify.get<{
      Params:{
        id : number
      },
      Reply:{
        200 : IUserStats,
        500 : {error:string},
      }
    }>('/:id/stats', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200 : userStatsSchema,
                500 : errSchema
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const stats = await getUserStats(fastify.db, id);
            return reply.code(200).send(stats);
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user match history
    fastify.get<{
      Params: {id : number},
      Reply:{
        200 : IGame[],
        500 : {error:string}
      }
    }>('/:id/matches', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response:{
              200 : gameSchema,
              500 : errSchema
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const matches = await getGamesHistoryByUserID(fastify, id);
            return reply.code(200).send(matches);
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });


    // New route with :id parameter (is it still in use? can be replaced by /api/protected/user/profile?)
    fastify.put<{
      Body:{img64:string},
      Reply:{
        202 : {message:string, avatar_url:string},
        400 : {error : string}
        500 : {error : string}
      }
    }>('/:id/avatar', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    img64 : {type : 'string'}
                },
                required: ['img64']
            },
        }
    }, async (request, reply) => {
      const { img64 } = request.body;
      try {
        const imgValid = await isValidImg(img64);
        if (!imgValid)
          return reply.code(400).send({error : "invalid image"});
        if (getBase64ImgSize(img64) > ConstantsPong.AVATAR_MAXSIZE)
          return reply.code(400).send({error : "image too big"});
        await setUserAvatar(fastify, img64, request.userid);

        return reply.code(202).send({
            message: 'Avatar uploaded successfully',
            avatar_url: img64,
        });
      } catch (err:unknown) {
          if (err instanceof CustomError)  
            fastify.log.error('Error in avatar upload: ' + err.message);
          fastify.log.error(err);
          return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Search users by username
    fastify.get<{
      Querystring : { query : string },
      Reply:{
        200 : IUserSearchOnlineStatus[],
        500 : {error:string}
      } 
    }>('/search', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    query: { type: 'string' }
                },
                required: ['query']
            },
            response: {
                200: {
                    type: 'array',
                    items: userOnlineStatusByUsernameOrDisplayNameSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { query } = request.query;

            const users = await getUserOnlineStatusByUsernameOrDisplayName(fastify, query);
            return reply.code(200).send(users);
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    
    // Get user friendship status
    fastify.get<{
      Params:{id:number},

    }>('/:id/friendship', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', nullable: true },
                        direction: { type: 'string', nullable: true }
                    }
                }
            }
        },
    }, async (request, reply) => {
        const defVal = <{status:string|null, direction:string|null}>{status: null, direction: null};
        try {
            const { id } = request.params;
            const currentUserId = request.userid;
            if (parseInt(''+id) === currentUserId) {
                return defVal;
            }
            const friendship = await getFriendshipStatusByUidOrFid(fastify, currentUserId, id)
            return reply.code(200).send(friendship);
        } catch (err) {
            fastify.log.error(err);
        }
    });

    // Update profile
    fastify.put<{
      Body:{
        username ?: string
        avatar_base64 ?:string
        display_name ?: string
        email ?: string
        current_password ?: string
        new_password ?: string
        is_2fa_enabled?: boolean
      }
    }>('/profile', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    username : { type: 'string', minLength: 3, maxLength: 20 },
                    avatar_base64 : { type : 'string'},
                    display_name: { type: 'string', maxLength: 20 },
                    email: { type: 'string', format: 'email', maxLength: 50 },
                    current_password: { type: 'string'},
                    new_password: { type: 'string', maxLength: 12},
                    is_2fa_enabled: { type: 'boolean' }
                }
            },
            response: {
                200: userSchema,
                401: errSchema,
                404: errSchema,
                400: errSchema,
                500: errSchema
            }
        }
    }, async (request, reply) => {
        try {
            const {username, avatar_base64, display_name, email, current_password, new_password, is_2fa_enabled} = request.body;
            const userinfo = await getUserByID(fastify, request.userid);
            if (!userinfo)
              return reply.code(404).send({error:"user cannot be found"});
            if (username)
            {
              userinfo.username = username;
              const isUnique = await isUniqueUserName(fastify, username, request.userid);
              if (isUnique)
                await setUserUserName(fastify, username, request.userid);
              else
                return reply.code(400).send({ error: 'Username already exists' });
            }
            if (avatar_base64)
            {
              const imgValid = await isValidImg(avatar_base64);
              if (!imgValid)
                return reply.code(400).send({ error: "Invalid image format" });
              const imgSize = getBase64ImgSize(avatar_base64);
              if (imgSize > ConstantsPong.AVATAR_MAXSIZE)
                return reply.code(400).send({ error: `Image too large, max size is ${ConstantsPong.AVATAR_MAXSIZE / 1024}KB` });
              userinfo.avatar_url = avatar_base64;
              await setUserAvatar(fastify, avatar_base64, request.userid);
            }
            if (display_name !== null && display_name !== undefined)
            {
              userinfo.display_name = display_name;
              const isUnique = await isUniqueDisplayName(fastify, display_name, request.userid);
              if (isUnique)
                await setUserDisplayName(fastify, display_name, request.userid);
              else
                return reply.code(400).send({ error: 'Display name already exists' });
            }
            if (email)
            {
              userinfo.email = email;
              const isUnique = await isUniqueEmail(fastify, email, request.userid);
              if (isUnique)
                await setUserEmail(fastify, email, request.userid);
              else
                return reply.code(400).send({ error: 'Email already exists' });
            }
            if (current_password && new_password) {
              const validPassword = await verifyPW(userinfo.password_hash, current_password);
              if (!validPassword) {
                  reply.code(401).send({ error: 'Current password is incorrect' });
                  return;
              }
              userinfo.password_hash = await hashPW(new_password);
              await setUserPWHash(fastify, userinfo.password_hash, request.userid);
            }

            if (is_2fa_enabled !== null && is_2fa_enabled !== undefined)
                await setUserTwofa(fastify, Boolean(is_2fa_enabled), request.userid);

            return userinfo;
        } catch (error: unknown) {
          if ((error as any).code === 'SQLITE_CONSTRAINT')
            return reply.code(400).send({ error: 'Username or email already exists' });
          fastify.log.error(error);
          reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user online status - public endpoint
    fastify.get<{
      Params : {id : number},
      Reply:{
        200 : IUserOnlineStatus,
        404 : {error : string},
        500 : {error : string}
      }
    }>('/:id/status', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            response: {
                200: userOnlineStatusSchema
            }
        }
    }, async (request, reply) => {
        try {
          const { id } = request.params;
          const userStatus = await getUserOnlineStatus(fastify, id);
          if (!userStatus) 
            return reply.code(404).send({ error: 'User not found' });
          return reply.code(200).send(userStatus);
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
} 

export default userRoutes;