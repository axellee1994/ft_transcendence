# Stage 1: Build Frontend
FROM node:20-alpine AS builder-frontend
WORKDIR /app/frontend

# Paths are now relative to the project root context
# Copy frontend package files first for better caching
COPY ./frontend/package*.json ./
RUN npm install

# Copy the rest of the frontend source code
COPY ./frontend/ .

# Run the frontend build (output expected in /app/frontend/dist)
RUN npm run build

# Stage 2: Build Backend
FROM node:20-alpine AS builder-backend
WORKDIR /app

# Paths are now relative to the project root context
# Copy backend package files first
COPY ./backend/package*.json ./

# Install ALL dependencies (including dev) needed for the build
RUN npm install

# Copy the backend source code
COPY ./backend/ .

# Run the TypeScript build
RUN npm run build:ts

# Copy the built frontend assets from the builder stage
RUN mkdir -p public
COPY --from=builder-frontend /app/frontend/dist ./public/

# Expose the port the backend server listens on
EXPOSE 4002

# Command to run the backend server
CMD ["npm", "start"]

# Stage 3: Final Production Image
FROM node:20-alpine
WORKDIR /app

# Copy package.json for production dependencies installation
COPY ./backend/package*.json ./
# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy compiled backend code from backend builder stage
COPY --from=builder-backend /app/dist ./dist/

# Copy static frontend assets from frontend builder stage
COPY --from=builder-frontend /app/frontend/dist ./public/

# Copy database files if they are needed at runtime and not generated
# Ensure the path inside the container (/app/src/db) matches where your app expects it
# COPY --from=builder-backend /app/src/db ./src/db 
# Note: If db files are generated on start, this copy might not be needed or should be handled differently (e.g., volumes)

# Use npm run start:prod to launch the application via fastify-cli
# This ensures node_modules/.bin is correctly in the PATH
CMD ["npm", "run", "start:prod"] 