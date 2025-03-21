FROM node:20-alpine

# Set root as the user for rootless mode compatibility
USER root

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Fix any potential index.ts references in index.html
RUN sed -i 's/<script[^>]*src="index.ts"[^>]*><\/script>//g' /app/src/index.html

# Build the project for production
RUN npm run build

# Fix any index.ts references in the output HTML
RUN find /app/dist -name "*.html" -exec sed -i 's/<script[^>]*src="index.ts"[^>]*><\/script>//g' {} \;

# Expose port 4000
EXPOSE 4000

# Start development server
CMD ["npm", "start"]