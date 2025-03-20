import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = join(__dirname, '../../uploads/avatars');
await fs.mkdir(uploadsDir, { recursive: true });

export async function userRoutes(fastify, options) {
    const userSchema = {
        type: 'object',
        properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            avatar_url: { type: 'string' },
            wins: { type: 'integer' },
            losses: { type: 'integer' },
            is_online: { type: 'boolean' },
            last_seen: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
        }
    };

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
            const users = await fastify.db.all(`
                SELECT * FROM users 
                ORDER BY created_at DESC
            `);
            return users;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Create a new user
    fastify.post('/', {
        schema: {
            body: {
                type: 'object',
                required: ['username'],
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
        const { username, display_name, email, avatar_url, password } = request.body;
        
        try {
            // Hash password if provided
            const password_hash = password ? await fastify.bcrypt.hash(password) : null;
            
            const result = await fastify.db.run(`
                INSERT INTO users (
                    username, display_name, email, avatar_url, password_hash,
                    wins, losses, is_online, last_seen, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, 0, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [username, display_name || username, email || null, avatar_url || null, password_hash]);
            
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE id = ?
            `, result.lastID);
            
            reply.code(201);
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                reply.code(400).send({ error: 'Username or email already exists' });
                return;
            }
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user by ID
    fastify.get('/:id', {
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
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE id = ?
            `, id);
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            return user;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update user
    fastify.put('/:id', {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    avatar_url: { type: 'string' }
                }
            },
            response: {
                200: userSchema
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const updates = request.body;
            
            await fastify.db.run(`
                UPDATE users 
                SET username = ?, email = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [updates.username, updates.email, updates.avatar_url, id]);
            
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE id = ?
            `, id);
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                reply.code(400).send({ error: 'Username or email already exists' });
                return;
            }
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user stats
    fastify.get('/:id/stats', {
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
                        wins: { type: 'integer' },
                        losses: { type: 'integer' },
                        winRate: { type: 'number' },
                        totalGames: { type: 'integer' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const user = await fastify.db.get(`
                SELECT wins, losses FROM users WHERE id = ?
            `, id);
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            const totalGames = user.wins + user.losses;
            const winRate = totalGames > 0 ? (user.wins / totalGames) * 100 : 0;
            
            return {
                wins: user.wins,
                losses: user.losses,
                winRate: Math.round(winRate * 100) / 100,
                totalGames
            };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user match history
    fastify.get('/:id/matches', {
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
            const matches = await fastify.db.all(`
                SELECT * FROM games 
                WHERE player1_id = ? OR player2_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [id, id]);
            
            return matches;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Upload avatar
    fastify.post('/avatar', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const file = await request.file('avatar');
            
            if (!file) {
                reply.code(400).send({ error: 'No file uploaded' });
                return;
            }

            // Validate file type
            if (!file.mimetype.startsWith('image/')) {
                reply.code(400).send({ error: 'File must be an image' });
                return;
            }

            // Generate unique filename
            const ext = path.extname(file.filename);
            const filename = `${request.user.id}-${Date.now()}${ext}`;
            const filepath = join(uploadsDir, filename);

            // Save file
            await file.toBuffer();
            await fs.writeFile(filepath, await file.toBuffer());

            // Update user's avatar URL in database
            const avatarUrl = `/avatars/${filename}`;
            await fastify.db.run(
                'UPDATE users SET avatar_url = ? WHERE id = ?',
                [avatarUrl, request.user.id]
            );

            reply.send({ 
                message: 'Avatar uploaded successfully',
                avatar_url: avatarUrl
            });
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Search users by username
    fastify.get('/search', {
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
        },
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { query } = request.query;
            
            // Search for users where username contains the query string
            const users = await fastify.db.all(`
                SELECT id, username, display_name, avatar_url, is_online, last_seen
                FROM users 
                WHERE username LIKE ? OR display_name LIKE ?
                ORDER BY username ASC
                LIMIT 10
            `, [`%${query}%`, `%${query}%`]);
            
            return users;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
    
    // Get user friendship status
    fastify.get('/:id/friendship', {
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
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const currentUserId = request.user.id;
            
            // Don't check friendship with yourself
            if (parseInt(id) === currentUserId) {
                return { status: null, direction: null };
            }
            
            const friendship = await fastify.db.get(`
                SELECT 
                    status,
                    CASE 
                        WHEN user_id = ? THEN 'outgoing'
                        WHEN friend_id = ? THEN 'incoming'
                    END as direction
                FROM friendships 
                WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
            `, [currentUserId, currentUserId, currentUserId, id, id, currentUserId]);
            
            return friendship || { status: null, direction: null };
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Update profile
    fastify.put('/profile', {
        onRequest: [fastify.authenticate],
        schema: {
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                    display_name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    current_password: { type: 'string' },
                    new_password: { type: 'string' }
                }
            },
            response: {
                200: userSchema
            }
        }
    }, async (request, reply) => {
        try {
            const updates = request.body;
            const userId = request.user.id;
            
            // If password update is requested
            if (updates.current_password && updates.new_password) {
                // Get current user with password hash
                const user = await fastify.db.get(`
                    SELECT password_hash FROM users WHERE id = ?
                `, userId);
                
                if (!user) {
                    reply.code(404).send({ error: 'User not found' });
                    return;
                }
                
                // Verify current password
                const validPassword = await fastify.bcrypt.compare(updates.current_password, user.password_hash);
                if (!validPassword) {
                    reply.code(401).send({ error: 'Current password is incorrect' });
                    return;
                }
                
                // Update password
                const newPasswordHash = await fastify.bcrypt.hash(updates.new_password);
                await fastify.db.run(`
                    UPDATE users 
                    SET password_hash = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `, [newPasswordHash, userId]);
            }
            
            // Update other profile fields
            await fastify.db.run(`
                UPDATE users 
                SET username = COALESCE(?, username),
                    display_name = COALESCE(?, display_name),
                    email = COALESCE(?, email),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [updates.username, updates.display_name, updates.email, userId]);
            
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE id = ?
            `, userId);
            
            if (!user) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            return user;
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT') {
                reply.code(400).send({ error: 'Username or email already exists' });
                return;
            }
            fastify.log.error(error);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });

    // Get user online status - public endpoint
    fastify.get('/:id/status', {
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
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        is_online: { type: 'boolean' },
                        last_seen: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    }, async (request, reply) => {
        try {
            const { id } = request.params;
            const userStatus = await fastify.db.get(`
                SELECT id, username, is_online, last_seen FROM users WHERE id = ?
            `, id);
            
            if (!userStatus) {
                reply.code(404).send({ error: 'User not found' });
                return;
            }
            
            return userStatus;
        } catch (err) {
            fastify.log.error(err);
            reply.code(500).send({ error: 'Internal Server Error' });
        }
    });
} 