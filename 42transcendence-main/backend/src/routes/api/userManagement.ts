import { FastifyPluginAsync } from "fastify"
import { verifyPW, hashPW } from "../../service/authSvc"
import { errSchema, regBodySchema } from "../../model/jsonSchema"
import { Ireg } from "../../model/userModel"
import { createUser, getUserInfobyUserName, isExist, setOnlineStatusByID } from "../../service/userSvc"



// /api/auth
const userManagement: FastifyPluginAsync = async (fastify, opts): Promise<void> => {

  // Register new user
  fastify.post<{
    Body: { username: string, email: string, password: string },
    Reply: {
      201: Ireg,
      400: { error: string },
      409: { error: string },
      500: { error: string }
    }
  }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 }
        }
      },
      response: {
        201: regBodySchema,
        400: errSchema,
        409: errSchema,
        500: errSchema,
      }
    }
  }, async (request, reply) => {
    const { username, email, password } = request.body;

    try {
      // Check if user already exists
      const exist = await isExist(fastify, username, email);
      if (exist) {
        reply.code(400).send({
          error: 'Username or email already exists'
        });
        return;
      }

      // Hash the password
      const hashedPassword = await hashPW(password);

      // Create new user, passing the HASHED password
      const user = await createUser(fastify, username, email, hashedPassword, null, null);

      // Generate token
      const token = fastify.jwt.sign({ id: user.id });

      reply.code(201).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          is_online: user.is_online,
          last_seen: user.last_seen
        },
        token
      });
    } catch (error: unknown) {
      // Log the error regardless
      fastify.log.error(error, `Error during registration attempt for ${username}`);

      // Check if it's the specific "User exist" error from createUser
      if (error instanceof Error && (error.message.includes("User exist") || error.message.includes("already exists"))) {
        // Send a 409 Conflict if user already exists
        reply.code(409).send({ error: 'Username or email already exists' });
      } else {
        // Send a generic 500 for other unexpected errors
        reply.code(500).send({ error: 'Internal server error during registration' });
      }
    }
  });


  // Login
  fastify.post<{
    Body: { username: 'string', password: 'string' },
    Reply: {
      200: Ireg,
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
      response:{
        200 : regBodySchema,
        401 : errSchema,
        500 : errSchema
      }
    }
  }, async (request, reply) => {
    const { username, password } = request.body;

    try {
      // Find user
      const user = await getUserInfobyUserName(fastify, username);

      if (!user) {
        reply.code(401).send({
          error: 'Username not found. Please check your credentials.'
        });
        return;
      }

      // Check if password_hash exists
      if (!user.password_hash) {
        fastify.log.error(`User ${username} has no password hash`);
        reply.code(401).send({
          error: 'Account issue. Please contact administrator.'
        });
        return;
      }

      console.log(`[/login] Attempting login for user: ${username}`);
      console.log(`[/login] Password hash from DB (starts with ${user.password_hash?.substring(0, 10)}...)`);
      console.log(`[/login] Password provided in request: ${password}`);

      // Verify password
      const valid = await verifyPW(user.password_hash, password);
      console.log(`[/login] Password verification result: ${valid}`);
      if (!valid) {
        console.log(`[/login] Password verification failed for user: ${username}`);
        reply.code(401).send({
          error: 'Incorrect password. Please try again.'
        });
        return;
      }

      // Update user's online status
      await setOnlineStatusByID(fastify, user.id, true);

      // Generate token
      const token = fastify.jwt.sign({ id: user.id });

      reply.code(200).send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          is_online: user.is_online,
          last_seen: user.last_seen
        },
        token
      });
    } catch (error) {
      fastify.log.error(error);
      reply.code(500).send({ error: 'Server error during login. Please try again later.' });
    }
  });


}

export default userManagement;