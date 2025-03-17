#!/bin/bash

# Check if running in 42 school environment
if [[ -d "/goinfre" ]]; then
    DOCKER_DIR="/goinfre/$USER/docker"
else
    DOCKER_DIR="$HOME/.docker"
fi

# Create Docker config directory if it doesn't exist
mkdir -p "$DOCKER_DIR"

# Configure Docker to use the custom directory
if [[ ! -f "$HOME/.docker/config.json" ]]; then
    mkdir -p "$HOME/.docker"
    echo "{\"data-root\": \"$DOCKER_DIR\"}" > "$HOME/.docker/config.json"
fi

# Export current user's UID and GID for Docker
export UID=$(id -u)
export GID=$(id -g)

# Clean up any existing containers and volumes
docker compose down -v

# Build and start the containers
docker compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 5

# Check if services are accessible
echo "Checking service accessibility..."
curl -s http://localhost:4000 > /dev/null
if [ $? -eq 0 ]; then
    echo "Frontend is accessible at http://localhost:4000"
else
    echo "Warning: Frontend may not be accessible. Please check logs with 'docker compose logs frontend'"
fi

curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "Backend is accessible at http://localhost:3000"
else
    echo "Warning: Backend may not be accessible. Please check logs with 'docker compose logs backend'"
fi

echo "
Setup complete! You can access the application at:
- Frontend: http://localhost:4000
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/documentation

To view logs:
- Frontend: docker compose logs frontend
- Backend: docker compose logs backend
- Pong Game: docker compose logs pongstandalone

To stop the services:
- docker compose down

Note: If you're having permission issues, try:
1. Stop the services: docker compose down -v
2. Remove the Docker volumes: docker volume prune
3. Restart the setup: ./setup.sh" 