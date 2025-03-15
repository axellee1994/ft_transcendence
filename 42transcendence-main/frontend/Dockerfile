# Use Node.js Alpine as base image for smaller size
FROM node:20-alpine AS builder

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Configure npm to work with non-root user
ENV NPM_CONFIG_PREFIX=/home/appuser/.npm-global
ENV PATH="/home/appuser/.npm-global/bin:${PATH}"

# Switch to non-root user
USER appuser
WORKDIR /home/appuser/app

# Create required directories
RUN mkdir -p src/styles && \
    mkdir -p /home/appuser/.npm-global

# Copy configuration files first
COPY --chown=appuser:appgroup package*.json ./
COPY --chown=appuser:appgroup tsconfig.json ./
COPY --chown=appuser:appgroup tailwind.config.js ./

# Install all dependencies (including dev dependencies)
RUN npm install && \
    npm install @babylonjs/core@6.47.0 tailwindcss@3.4.1 express@4.18.2 && \
    npm install --save-dev @types/node @types/express typescript

# Copy source files
COPY --chown=appuser:appgroup src ./src

# Build the application
RUN npm run build

# Start fresh for production image
FROM node:20-alpine

# Set up non-root user in production
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

USER appuser
WORKDIR /home/appuser/app

# Copy all necessary files from builder
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/package*.json ./
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/tsconfig.json ./
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/tailwind.config.js ./
COPY --from=builder --chown=appuser:appgroup /home/appuser/app/src ./src

# Create required directories
RUN mkdir -p dist src/styles

# Expose port for access
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.js"]