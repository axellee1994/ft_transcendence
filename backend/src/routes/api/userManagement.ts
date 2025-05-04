import { FastifyPluginAsync } from "fastify"
import { verifyPW } from "../../service/authSvc"
import { errSchema, loginBodySchema, regBodySchema } from "../../model/jsonSchema"
import { Ilogin, Ireg, Itwofas, GoogleUserInfo } from "../../model/userModel"
import { createUser, getUserInfobyUserName, isExist, setOnlineStatusByID, generate2FaCode, deleteTwofas, insertTwofas, getTwofas, login } from "../../service/userSvc"
import { updateIsRemoteUser } from "../../service/userSvc"
import { send2FACode } from '../../service/emailSvc';
import ConstantsPong from "../../ConstantsPong"


// /api/auth
const userManagement: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

  // Register new user
  fastify.post<{
    Body: { username: string, email: string, password: string },
    Reply: {
      201: Ireg,
      400: { error: string },
      500: { error: string }
    }
  }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 20 },
          email: { type: 'string', format: 'email', maxLength: 50 },
          password: { type: 'string', minLength: 6, maxLength: 12 }
        }
      },
      response: {
        201: regBodySchema,
        400: errSchema,
        500: errSchema,
      }
    }
  }, async (request, reply) => {
    const { username, email, password } = request.body;

    try {
      const exist = await isExist(fastify, username, email);
      if (exist) {
        reply.code(400).send({
          error: 'Username or email already exists'
        });
        return;
      }

      const user = await createUser(fastify, username, email, password);

      const token = fastify.jwt.sign({ id: user.id });

      reply.code(201).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          is_online: Boolean(user.is_online),
          last_seen: user.last_seen,
          is_2fa_enabled: Boolean(user.is_2fa_enabled),
          is_remote_user: Boolean(user.is_remote_user)
        },
        token
      });
    } catch (error: unknown) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Error creating user' });
    }
  });


  // Login
  fastify.post<{
    Body: { username: 'string', password: 'string' },
    Reply: {
      200: Ilogin,
      401: { error: string },
      500: { error: string }
    }
  }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        }
      },
      response: {
        200: loginBodySchema,
        401: errSchema,
        500: errSchema
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body;

    try {
      const user = await getUserInfobyUserName(fastify, username);

      if (!user) {
        reply.code(401).send({
          error: 'Username not found. Please check your credentials.'
        });
        return;
      }

      if (!user.password_hash) {
        fastify.log.error(`User ${username} has no password hash`);
        reply.code(401).send({
          error: 'Account issue. Please contact administrator.'
        });
        return;
      }

      const valid = await verifyPW(user.password_hash, password);
      if (!valid) {
        reply.code(401).send({
          error: 'Incorrect password. Please try again.'
        });
        return;
      }

      if (user.is_2fa_enabled) {
        const twofa_code = await generate2FaCode();
        await deleteTwofas(fastify, user.id);
        await insertTwofas(fastify, twofa_code, user.id);
        await send2FACode(user.email, twofa_code);

        const data = {
          user: {
            id: user.id,
            is_2fa_enabled: Boolean(user.is_2fa_enabled)
          }
        };
        reply.code(200).send(data);
        return;
      }

      await setOnlineStatusByID(fastify, user.id, true);

      const token = fastify.jwt.sign({ id: user.id });

      reply.code(200).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          display_name: user.display_name,
          is_online: Boolean(user.is_online),
          last_seen: user.last_seen,
          is_2fa_enabled: Boolean(user.is_2fa_enabled),
          is_remote_user: Boolean(user.is_remote_user)
        },
        token
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Server error during login. Please try again later.' });
    }
  });


  // Login 2FA
  fastify.post<{
    Body: { username: 'string', password: 'string', twofaCode: 'number' },
    Reply: {
      200: Ireg,
      401: { error: string },
      500: { error: string }
    }
  }>('/login2fa', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password', 'twofaCode'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' },
          twofaCode: { type: 'number' }
        }
      },
      response: {
        200: regBodySchema,
        401: errSchema,
        500: errSchema
      }
    }
  }, async (request, reply) => {
    const { username, password, twofaCode } = request.body;

    try {
      const user = await getUserInfobyUserName(fastify, username);

      if (!user) {
        reply.code(401).send({
          error: 'Username not found. Please check your credentials.'
        });
        return;
      }

      if (!user.password_hash) {
        fastify.log.error(`User ${username} has no password hash`);
        reply.code(401).send({
          error: 'Account issue. Please contact administrator.'
        });
        return;
      }

      const valid = await verifyPW(user.password_hash, password);
      if (!valid) {
        reply.code(401).send({
          error: 'Incorrect password. Please try again.'
        });
        return;
      }


      const twofas = await getTwofas(fastify, user.id) as Itwofas;
      if (!twofas) {
        reply.code(401).send({
          error: '2FA code expired. Please try again.'
        });
        return;
      }

      if (Number(twofas.code) !== Number(twofaCode)) {
        reply.code(401).send({
          error: '2FA code not matched. Please try again.'
        });
        return;
      }

      await setOnlineStatusByID(fastify, user.id, true);

      const token = fastify.jwt.sign({ id: user.id });

      reply.code(200).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          is_online: Boolean(user.is_online),
          last_seen: user.last_seen,
          is_2fa_enabled: Boolean(user.is_2fa_enabled),
          avatar_url: user.avatar_url,
          is_remote_user: Boolean(user.is_remote_user)
        },
        token
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Server error during login. Please try again later.' });
    }
  });

  // The service provider redirect the user here after successful login
  fastify.get('/google/callback', async function (request, reply) {
    try {
      const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      const userInfoResponse = await fetch(ConstantsPong.GOOGLE_OAUTH2_API, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
      });
      if (!userInfoResponse.ok) {
        console.error('Error fetching user info:', userInfoResponse.statusText);
        return reply.code(500).send({ error: 'Error fetching user info' });
      }
      const userData = await userInfoResponse.json() as GoogleUserInfo;

      const username = userData.name;
      const email = userData.email;

      const existingUser = await isExist(fastify, username, email);
      if (existingUser) {
        const loginResponse = await login(username, ConstantsPong.GOOGLE_TEMP_PW, fastify);

        if (loginResponse) {
          const token = loginResponse.token;
          const email = loginResponse.user.email;
          const id = loginResponse.user.id;
          const display_name = loginResponse.user.display_name;
          const avatar_url = loginResponse.user.avatar_url;

          reply
            .setCookie('auth_token', String(token), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('username', String(username), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('email', String(email), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('user_id', String(id), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('display_name', String(display_name), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            });

          return reply.redirect(`${ConstantsPong.FRONTEND_ROOT_URL}?redirected=true&avatar_url=${encodeURIComponent(avatar_url)}`);
        }
        console.error('Error logging in:', loginResponse);
        return reply.code(500).send({ error: 'Error logging in user' });
      }

      const newUser = await createUser(fastify, username, email, ConstantsPong.GOOGLE_TEMP_PW);

      if (newUser) {

        await updateIsRemoteUser(fastify, newUser.id);

        const loginData = await login(username, ConstantsPong.GOOGLE_TEMP_PW, fastify);

        if (loginData) {
          const token = loginData.token;
          const email = loginData.user.email;
          const id = loginData.user.id;

          reply
            .setCookie('auth_token', String(token), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('username', String(username), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('email', String(email), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            })
            .setCookie('user_id', String(id), {
              path: '/', secure: true, sameSite: 'none', httpOnly: false
            });

          return reply.redirect(`${ConstantsPong.FRONTEND_ROOT_URL}?redirected=true`);
        }
        console.error('Error logging in:', loginData);
        return reply.code(500).send({ error: 'Error logging in user' });
      }
      console.error('Error registering:', newUser);
      return reply.code(500).send('Error registering user');
    } catch (err) {
      console.error('Error during callback:', err);
      reply.code(500).send('Internal Server Error');
    }
  })
}

export default userManagement;
