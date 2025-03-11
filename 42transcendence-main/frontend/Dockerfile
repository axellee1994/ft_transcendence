FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Create dist directory
RUN mkdir -p dist

# Build the initial assets
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the development server with hot reload
CMD sh -c "npm start & wait"