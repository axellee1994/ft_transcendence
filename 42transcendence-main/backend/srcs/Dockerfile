FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY backend/srcs/package*.json ./
RUN npm install

# Bundle app source
COPY backend/srcs/ .

# Copy test files
COPY tests/ ./tests/

# Create data directory
RUN mkdir -p data

# Expose API port
EXPOSE 3001

# Command to run the application
CMD ["node", "server.js"]
