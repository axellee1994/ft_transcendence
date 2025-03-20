export async function authRoutes(fastify, options) {
    // Register new user
    fastify.post('/register', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                    username: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                }
            }
        }
    }, async (request, reply) => {
        const { username, email, password } = request.body;
        
        try {
            // Check if user already exists
            const existingUser = await fastify.db.get(`
                SELECT id FROM users 
                WHERE username = ? OR email = ?
            `, [username, email]);
                
            if (existingUser) {
                reply.code(400).send({
                    error: 'Username or email already exists'
                });
                return;
            }
            
            // Create new user
            const result = await fastify.db.run(`
                INSERT INTO users (
                    username, email, password_hash, 
                    is_online, last_seen, created_at, updated_at
                ) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `, [username, email, await fastify.bcrypt.hash(password)]);
            
            const user = await fastify.db.get(`
                SELECT id, username, email, created_at 
                FROM users WHERE id = ?
            `, result.lastID);
            
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
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({
                error: 'Error creating user'
            });
        }
    });

    // Login
    fastify.post('/login', {
        schema: {
            body: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                    username: { type: 'string' },
                    password: { type: 'string' }
                }
            }
        }
    }, async (request, reply) => {
        const { username, password } = request.body;
        
        try {
            // Find user
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE username = ?
            `, username);
                
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
            
            // Verify password
            const valid = await fastify.bcrypt.compare(password, user.password_hash);
            if (!valid) {
                reply.code(401).send({
                    error: 'Incorrect password. Please try again.'
                });
                return;
            }
            
            // Update user's online status
            await fastify.db.run(`
                UPDATE users 
                SET is_online = 1, last_seen = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, user.id);
            
            // Generate token
            const token = fastify.jwt.sign({ id: user.id });
            
            reply.send({
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
            reply.code(500).send({
                error: 'Server error during login. Please try again later.'
            });
        }
    });

    // Get current user
    fastify.get('/me', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = await fastify.db.get(`
                SELECT * FROM users WHERE id = ?
            `, request.user.id);
                
            if (!user) {
                reply.code(404).send({
                    error: 'User not found'
                });
                return;
            }
            
            reply.send({
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                wins: user.wins,
                losses: user.losses
            });
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({
                error: 'Error fetching user'
            });
        }
    });

    // Logout
    fastify.post('/logout', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            // Set user as offline
            await fastify.db.run(`
                UPDATE users 
                SET is_online = 0, last_seen = CURRENT_TIMESTAMP 
                WHERE id = ?
            `, request.user.id);
            
            // In a real application, you might want to invalidate the token
            // For now, we'll just send a success response
            reply.send({ message: 'Logged out successfully' });
        } catch (error) {
            fastify.log.error(error);
            reply.code(500).send({ error: 'Error during logout' });
        }
    });
} 