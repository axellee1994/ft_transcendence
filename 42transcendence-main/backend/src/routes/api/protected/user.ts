// import { fileURLToPath } from 'url';
// import { dirname, join } from 'path';
// import fs from 'fs/promises';
// import fsSync from 'fs';
// import path from 'path';
// import { pipeline } from 'stream';
// import { promisify } from 'util';
// import { Readable } from 'stream';
import { FastifyPluginAsync } from 'fastify';
import { userSchema } from '../../../model/jsonSchema';
import { hashPW, verifyPW } from '../../../service/authSvc'; 
import * as userSvc from '../../../service/userSvc';
import * as userStatsSvc from '../../../service/userStatsSvc'; // Import userStatsSvc
import ServerRequestError from '../../../error/ServerRequestError';
import BadRequestError from '../../../error/BadRequestError';
import SQLStatement from '../../../SQLStatement'; // Import SQLStatement

// Promisify the pipeline function for async/await usage


const userRoutes : FastifyPluginAsync = async (fastify, options) => {

  // Get all users
  fastify.get('/', {
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
          // Use SQLStatement constant
          const users = await fastify.db.all(SQLStatement.USER_GET_ALL);
          return users;
      } catch (err) {
          fastify.log.error(err);
          reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

  // Create a new user
  fastify.post<{
    Body:{
      username: string,
      display_name?: string,
      email: string,
      avatar_url ?: string
      password : string
    }
  }>('/', {
      schema: {
          body: {
              type: 'object',
               // Added email and password as required based on userSvc.createUser
              required: ['username', 'email', 'password'],
              properties: {
                  username: { type: 'string' },
                  display_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  avatar_url: { type: 'string' },
                  password: { type: 'string' }
              }
          },
          response: {
              201: userSchema
          }
      }
  }, async (request, reply) => {
      // Destructure all potential fields from the body
      const { username, email, password, display_name, avatar_url } = request.body;
      
      try {
          // Pass all destructured fields to the updated service function
          const user = await userSvc.createUser(fastify, username, email, password, display_name || null, avatar_url || null);
          reply.code(201).send(user);
      } catch (error: any) { // Catch block updated to align with service errors
          fastify.log.error(`User creation failed: ${error instanceof Error ? error.message : String(error)}`);
          if (error instanceof BadRequestError) {
              // Check specific messages for potential 409 conflict
              if (error.message.includes('User exist') || error.message.includes('already exists')) {
                reply.code(409).send({ error: error.message });
              } else {
                reply.code(400).send({ error: error.message });
              }
          } else if (error instanceof ServerRequestError) {
              reply.code(500).send({ error: error.message });
          } else {
              // Generic fallback
              reply.code(500).send({ error: 'Internal Server Error during user creation' });
          }
      }
  });

  // Get user by ID
  fastify.get<{
     // Use number directly if schema validates
    Params : {id : number}
  }>('/:id', {
      schema: {
          params: {
              type: 'object',
              properties: {
                  id: { type: 'integer' }
              },
              required: ['id']
          },
          response: {
              200: userSchema,
              404: { type: 'object', properties: { error: { type: 'string' } } }
          }
      }
  }, async (request, reply) => {
      try {
          const { id } = request.params;
          const user = await userSvc.getUserByID(fastify, id);
          if (!user) {
              reply.code(404).send({ error: 'User not found' });
              return;
          }
          return user;
      } catch (err) {
          fastify.log.error(`Error fetching user by ID ${request.params.id}: ${err instanceof Error ? err.message : String(err)}`);
           if (err instanceof ServerRequestError || err instanceof BadRequestError)
               reply.code(err.statusCode).send({ error: err.errors[0].message });
           else
               reply.code(500).send({ error: 'Internal Server Error' });
      }
  });

    // Get user stats
    fastify.get<{
      Params:{ id : number }
    }>('/:id/stats', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                },
                required: ['id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'integer' },
                        games_played: { type: 'integer' },
                        games_won: { type: 'integer' },
                        highest_score: { type: ['integer', 'null'] }, 
                        fastest_win_seconds: { type: ['integer', 'null'] },
                        longest_game_seconds: { type: ['integer', 'null'] },
                        created_at: { type: 'string' },
                        updated_at: { type: 'string' },
                        win_rate: { type: 'number' }
                    },
                    required: ['user_id', 'games_played', 'games_won', 'created_at', 'updated_at']
                },
                404: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const stats = await userStatsSvc.getUserStats(fastify.db, id);
            return stats;
        } catch (err) {
            fastify.log.error(`Error fetching stats for user ${request.params.id}: ${err instanceof Error ? err.message : String(err)}`);
             if (err instanceof ServerRequestError || err instanceof BadRequestError) {
                 if (err.message.includes('find stats') || err.message.includes('Failed to create or find'))
                     reply.code(404).send({ error: 'User stats not found' });
                 else
                     reply.code(err.statusCode).send({ error: err.errors[0].message });
             } else
                 reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user match history
    fastify.get<{
      Params: {id : number}
    }>('/:id/matches', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            // Use SQLStatement constant
            const matches = await fastify.db.all(SQLStatement.USER_GET_MATCH_HISTORY, [id]);
            
            return matches;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    /*
    // New route with :id parameter
    fastify.put('/:id/avatar', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                },
                required: ['id']
            },
            consumes: ['multipart/form-data']
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            
            // Check if user has permission to update this avatar
            if (request.userid !== parseInt(id)) {
                return reply.code(403).send({ error: 'Unauthorized to update this avatar' });
            }
            
            fastify.log.info('Processing avatar upload');
            
            // Get the uploaded file using request.file()
            const file = await request.file();
            
            if (!file) {
                fastify.log.info('No file received in request');
                return reply.code(400).send({ error: 'No file uploaded' });
            }
            
            fastify.log.info(`Received file: ${file.filename}, mimetype: ${file.mimetype}, fieldname: ${file.fieldname}`);
            
            // Check if it's actually an avatar upload
            if (file.fieldname !== 'avatar') {
                fastify.log.info(`Invalid field name: ${file.fieldname}, expected 'avatar'`);
                return reply.code(400).send({ error: 'Invalid form field, expected "avatar"' });
            }
            
            // Validate file type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                fastify.log.info(`Invalid file type: ${file.mimetype}`);
                return reply.code(400).send({ error: 'File must be a valid image (JPEG, PNG, GIF, or WebP)' });
            }
            
            // Sanitize filename to prevent directory traversal
            const sanitizedFilename = path.basename(file.filename).replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileExt = path.extname(sanitizedFilename) || '.jpg';
            
            // Generate unique filename with timestamp and random string
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 8);
            const newFilename = `${id}-${timestamp}-${randomString}${fileExt}`;
            const savePath = join(uploadsDir, newFilename);
            
            fastify.log.info(`Saving file to: ${savePath}`);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(savePath), { recursive: true });
            
            // Create write stream and pipe the file to it
            const writeStream = fsSync.createWriteStream(savePath);
            await pipelineAsync(file.file, writeStream);
            
            fastify.log.info('File saved successfully');
            
            // Delete old avatar if it exists
            const oldUser = await fastify.db.get('SELECT avatar_url FROM users WHERE id = ?', [id]);
            if (oldUser && oldUser.avatar_url) {
                const oldAvatarPath = join(uploadsDir, path.basename(oldUser.avatar_url));
                try {
                    await fs.unlink(oldAvatarPath);
                    fastify.log.info(`Deleted old avatar: ${oldAvatarPath}`);
                } catch (err) {
                    // Don't fail if old avatar couldn't be deleted
                    fastify.log.warn(`Could not delete old avatar: ${err.message}`);
                }
            }
            
            // Update user's avatar URL in database
            const avatarUrl = `/avatars/${newFilename}`;
            await fastify.db.run(
                'UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [avatarUrl, id]
            );
            
            fastify.log.info(`User ${id} avatar updated to ${avatarUrl}`);
            
            // Get updated user data
            const [user] = await fastify.db.all(
                'SELECT id, username, display_name, email, avatar_url, is_online, last_seen FROM users WHERE id = ?',
                [id]
            );
            
            return reply.send({
                message: 'Avatar uploaded successfully',
                avatar_url: avatarUrl,
                user: user
            });
        } catch (err) {
            fastify.log.error('Error in avatar upload: ' + err.message);
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    
    // Upload avatar - original POST route for backward compatibility
    fastify.post('/avatar', {
        schema: {
            consumes: ['multipart/form-data']
        },
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            fastify.log.info('Processing avatar upload via POST /avatar');
            
            // Get the uploaded file using request.file()
            const file = await request.file();
            
            if (!file) {
                fastify.log.info('No file received in request');
                return reply.code(400).send({ error: 'No file uploaded' });
            }
            
            fastify.log.info(`Received file: ${file.filename}, mimetype: ${file.mimetype}, fieldname: ${file.fieldname}`);
            
            // Check if it's actually an avatar upload
            if (file.fieldname !== 'avatar') {
                fastify.log.info(`Invalid field name: ${file.fieldname}, expected 'avatar'`);
                return reply.code(400).send({ error: 'Invalid form field, expected "avatar"' });
            }
            
            // Validate file type
            if (!file.mimetype.startsWith('image/')) {
                fastify.log.info(`Invalid file type: ${file.mimetype}`);
                return reply.code(400).send({ error: 'File must be an image' });
            }
            
            // Generate unique filename
            const fileExt = path.extname(file.filename) || '.jpg';
            const newFilename = `${request.user.id}-${Date.now()}${fileExt}`;
            const savePath = join(uploadsDir, newFilename);
            
            fastify.log.info(`Saving file to: ${savePath}`);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(savePath), { recursive: true });
            
            // Create write stream and pipe the file to it
            const writeStream = fsSync.createWriteStream(savePath);
            await pipelineAsync(file.file, writeStream);
            
            fastify.log.info('File saved successfully');
            
            // Update user's avatar URL in database
            const avatarUrl = `/avatars/${newFilename}`;
            await fastify.db.run(
                'UPDATE users SET avatar_url = ? WHERE id = ?',
                [avatarUrl, request.user.id]
            );
            
            fastify.log.info(`User ${request.user.id} avatar updated to ${avatarUrl}`);
            
            // Get updated user data
            const [user] = await fastify.db.all(
                'SELECT id, username, display_name, email, avatar_url, is_online, last_seen FROM users WHERE id = ?',
                [request.user.id]
            );
            
            return reply.send({
                message: 'Avatar uploaded successfully',
                avatar_url: avatarUrl,
                user: user
            });
        } catch (err) {
            fastify.log.error('Error in avatar upload: ' + err.message);
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });


    // Upload avatar - original PUT route for backward compatibility
    fastify.put('/avatar', {
        schema: {
            consumes: ['multipart/form-data']
        },
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            fastify.log.info('Processing avatar upload via PUT /avatar');
            
            // Get the uploaded file using request.file()
            const file = await request.file();
            
            if (!file) {
                fastify.log.info('No file received in request');
                return reply.code(400).send({ error: 'No file uploaded' });
            }
            
            fastify.log.info(`Received file: ${file.filename}, mimetype: ${file.mimetype}, fieldname: ${file.fieldname}`);
            
            // Check if it's actually an avatar upload
            if (file.fieldname !== 'avatar') {
                fastify.log.info(`Invalid field name: ${file.fieldname}, expected 'avatar'`);
                return reply.code(400).send({ error: 'Invalid form field, expected "avatar"' });
            }
            
            // Validate file type
            if (!file.mimetype.startsWith('image/')) {
                fastify.log.info(`Invalid file type: ${file.mimetype}`);
                return reply.code(400).send({ error: 'File must be an image' });
            }
            
            // Generate unique filename
            const fileExt = path.extname(file.filename) || '.jpg';
            const newFilename = `${request.user.id}-${Date.now()}${fileExt}`;
            const savePath = join(uploadsDir, newFilename);
            
            fastify.log.info(`Saving file to: ${savePath}`);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(savePath), { recursive: true });
            
            // Create write stream and pipe the file to it
            const writeStream = fsSync.createWriteStream(savePath);
            await pipelineAsync(file.file, writeStream);
            
            fastify.log.info('File saved successfully');
            
            // Update user's avatar URL in database
            const avatarUrl = `/avatars/${newFilename}`;
            await fastify.db.run(
                'UPDATE users SET avatar_url = ? WHERE id = ?',
                [avatarUrl, request.user.id]
            );
            
            fastify.log.info(`User ${request.user.id} avatar updated to ${avatarUrl}`);
            
            // Get updated user data
            const [user] = await fastify.db.all(
                'SELECT id, username, display_name, email, avatar_url, is_online, last_seen FROM users WHERE id = ?',
                [request.user.id]
            );
            
            return reply.send({
                message: 'Avatar uploaded successfully',
                avatar_url: avatarUrl,
                user: user
            });
        } catch (err) {
            fastify.log.error('Error in avatar upload: ' + err.message);
            fastify.log.error(err);
            return reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    */

    // Search users by username
    fastify.get<{
      Querystring : {
        query : string
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
                    items: userSchema
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { query } = request.query;
            const currentUserId = request.userid; // Get the logged-in user's ID
            
            // Use SQLStatement constant
            const users = await fastify.db.all(
                SQLStatement.USER_SEARCH, 
                [`%${query}%`, `%${query}%`, currentUserId]
            );
            
            return users;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    
    // Get user friendship status
    fastify.get<{
      Params:{id:string}
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
        try {
            const { id } = request.params;
            const currentUserId = request.userid;
            
            // Don't check friendship with yourself
            if (parseInt(id) === currentUserId) {
                return { status: null, direction: null };
            }
            
            // Use SQLStatement constant
            const friendship = await fastify.db.get(
                SQLStatement.USER_GET_FRIENDSHIP_STATUS,
                [currentUserId, currentUserId, currentUserId, id, id, currentUserId]
            );
            
            return friendship || { status: null, direction: null };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update profile
    fastify.put<{
      Body:{
        username?: string
        display_name?: string
        email?: string
        current_password?: string
        new_password?: string
        avatar_base64?: string
      }
    }>('/profile', {
        schema: {
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string', nullable: true },
                    display_name: { type: 'string', nullable: true },
                    email: { type: 'string', format: 'email', nullable: true },
                    current_password: { type: 'string', nullable: true },
                    new_password: { type: 'string', nullable: true },
                    avatar_base64: { type: 'string', nullable: true }
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                         id: { type: 'integer' },
                         username: { type: 'string' },
                         email: { type: 'string', format:'email' },
                         display_name: { type: ['string', 'null'] },
                         avatar_url: { type: ['string', 'null'] },
                         is_online: { type: 'boolean' },
                         last_seen: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const updates = request.body;
            const userId = request.userid;
            
            // --- Password Update Logic ---
            if (updates.current_password && updates.new_password) {
                // Get current user's hash (using service function)
                const user = await userSvc.getUserByID(fastify, userId);
                
                if (!user || !user.password_hash) {
                    // Log error if hash is missing, which shouldn't happen for logged-in user
                    fastify.log.error(`Password hash missing for user ${userId} during password update attempt.`);
                    reply.code(404).send({ error: 'User not found or account issue' });
                    return;
                }
                
                // Verify current password (using authSvc function)
                const validPassword = await verifyPW(user.password_hash, updates.current_password);
                if (!validPassword) {
                    reply.code(401).send({ error: 'Current password is incorrect' });
                    return;
                }
                
                // Hash the new password (using authSvc function)
                const newPasswordHash = await hashPW(updates.new_password);
                
                // Update password using the new service function
                await userSvc.updateUserPassword(fastify, userId, newPasswordHash);
            } 
            // Prevent accidental password wipe if only one password field is sent
            else if (updates.current_password || updates.new_password) {
                reply.code(400).send({ error: 'Both current and new password must be provided to change password.' });
                return;
            }

            // --- Profile Fields Update Logic ---
            const profileUpdates: { username?: string; display_name?: string; email?: string } = {};
            if (updates.username !== undefined) profileUpdates.username = updates.username;
            if (updates.display_name !== undefined) profileUpdates.display_name = updates.display_name;
            if (updates.email !== undefined) profileUpdates.email = updates.email;

            // Update profile fields using the service function
            if (Object.keys(profileUpdates).length > 0) {
                await userSvc.updateUserProfile(fastify, userId, profileUpdates);
            }

            // --- Avatar Update Logic ---
            if (updates.avatar_base64 !== undefined) {
                // Check for null or empty string specifically if needed, 
                // otherwise pass directly to service which validates format
                 await userSvc.updateUserAvatar(fastify, userId, updates.avatar_base64);
            }
            
            // --- Fetch Updated User Data ---
            // Use service function to get user data (excluding password hash)
            const updatedUser = await userSvc.getUserByID(fastify, userId);
            
            if (!updatedUser) {
                 // This really shouldn't happen if updates were successful
                 fastify.log.error(`Failed to fetch user ${userId} after profile update.`);
                 reply.code(404).send({ error: 'User not found after update' });
                 return;
            }
            
             // Return only relevant user fields (exclude password hash, 2FA secret etc.)
             const responseUser = {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                display_name: updatedUser.display_name,
                avatar_url: updatedUser.avatar_url, // Include avatar URL
                is_online: updatedUser.is_online,
                last_seen: updatedUser.last_seen
             };

            reply.send(responseUser);

        } catch (error) {
             // Handle specific errors thrown by service functions
             if (error instanceof BadRequestError) {
                 reply.code(error.statusCode).send({ error: error.message });
                 return;
             } 
             if (error instanceof ServerRequestError) {
                 reply.code(error.statusCode).send({ error: error.message });
                 return;
             }
             // Handle potential UNIQUE constraint errors from updateUserProfile
             if ((error as any).code === 'SQLITE_CONSTRAINT') {
                 reply.code(400).send({ error: 'Username or email already exists' });
                 return;
             }
             // Generic fallback
             fastify.log.error(error);
             reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user online status - public endpoint
    fastify.get<{
      Params : {id : number}
    }>('/:id/status', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                },
                required: ['id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        is_online: { type: 'boolean' },
                        last_seen: { type: 'string' } // Removed format: date-time for simplicity if not guaranteed
                    },
                     required: ['id', 'username', 'is_online', 'last_seen']
                },
                 404: { type: 'object', properties: { error: { type: 'string' } } }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await userSvc.getUserByID(fastify, id);
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            // Extract and return only the required status fields
            const userStatus = {
                id: user.id,
                username: user.username,
                is_online: user.is_online,
                last_seen: user.last_seen
            }
            return userStatus;
        } catch (err) {
             fastify.log.error(`Error fetching status for user ${request.params.id}: ${err instanceof Error ? err.message : String(err)}`);
             if (err instanceof ServerRequestError || err instanceof BadRequestError)
                 reply.code(err.statusCode).send({ error: err.errors[0].message });
             else
                 reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
} 

export default userRoutes;