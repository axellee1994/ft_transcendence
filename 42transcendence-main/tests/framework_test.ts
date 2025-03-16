// test.ts - Save this in your project root to test the checker
import { useState, useEffect } from 'react';  // Should trigger violation
// Express removed as it's not allowed
import fastify from 'fastify';               // This is allowed
import { v4 as uuidv4 } from 'uuid';         // This is fine

// Using Fastify instead of Express
const server = fastify();