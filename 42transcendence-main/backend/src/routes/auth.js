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
            const existingUser = await fastify.db('users')
                .where({ username })
                .orWhere({ email })
                .first();
                
            if (existingUser) {
                reply.code(400).send({
                    error: 'Username or email already exists'
                });
                return;
            }
            
            // Create new user
            const user = await fastify.db('users')
                .insert({
                    username,
                    email,
                    password_hash: await fastify.bcrypt.hash(password),
                    created_at: new Date(),
                    updated_at: new Date()
                })
                .returning(['id', 'username', 'email', 'created_at']);
            
            // Generate token
            const token = fastify.jwt.sign({ id: user.id });
            
            reply.code(201).send({
                user,
                token
            });
        } catch (error) {
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
            const user = await fastify.db('users')
                .where({ username })
                .first();
                
            if (!user) {
                reply.code(401).send({
                    error: 'Invalid credentials'
                });
                return;
            }
            
            // Verify password
            const valid = await fastify.bcrypt.compare(password, user.password_hash);
            if (!valid) {
                reply.code(401).send({
                    error: 'Invalid credentials'
                });
                return;
            }
            
            // Generate token
            const token = fastify.jwt.sign({ id: user.id });
            
            reply.send({
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                },
                token
            });
        } catch (error) {
            reply.code(500).send({
                error: 'Error during login'
            });
        }
    });

    // Get current user
    fastify.get('/me', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        try {
            const user = await fastify.db('users')
                .where({ id: request.user.id })
                .first();
                
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
            reply.code(500).send({
                error: 'Error fetching user'
            });
        }
    });

    // Logout
    fastify.post('/logout', {
        onRequest: [fastify.authenticate]
    }, async (request, reply) => {
        // In a real application, you might want to invalidate the token
        // For now, we'll just send a success response
        reply.send({ message: 'Logged out successfully' });
    });
} 