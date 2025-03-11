// test.ts - Save this in your project root to test the checker
import { useState, useEffect } from 'react';  // Should trigger violation
import express from 'express';                // Should trigger violation
import fastify from 'fastify';               // This is allowed
import { v4 as uuidv4 } from 'uuid';         // This is fine

const app = express();