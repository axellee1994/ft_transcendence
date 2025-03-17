FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create necessary directories
RUN mkdir -p src/db

# Set permissions for the db directory
RUN chown -R root:root src/db && chmod 755 src/db

RUN mkdir -p tests

# This will be handled during the build process with a separate command
# since we can't access files outside the build context

EXPOSE 4002

CMD ["npm", "start"] 