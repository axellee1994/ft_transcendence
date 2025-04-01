# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: user                                        +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2024/03/05 12:54:20 by user              #+#    #+#             #
#    Updated: 2024/03/24 17:21:40 by user             ###   ########.fr       #
#                                                                              #
# **************************************************************************** #

# Colors for terminal output
RED = \033[1;31m
GREEN = \033[1;32m
YELLOW = \033[1;33m
BLUE = \033[1;34m
PURPLE = \033[1;35m
RESET = \033[0m

# Project name
NAME := transcendence

# Directories
PROJECT_DIR := $(shell pwd)
# FRONTEND_DIR := $(PROJECT_DIR)/frontend # No longer needed for basic build/run
BACKEND_DIR := $(PROJECT_DIR)/backend

# docker-compose file
COMPOSE_FILE := $(PROJECT_DIR)/docker-compose.yml

# Default target
all: check-docker check-compose $(NAME)

# Check if Docker is installed
check-docker:
	@echo "$(BLUE)Checking Docker installation...$(RESET)"
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "$(RED)Docker is not installed$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Docker is installed$(RESET)"
	@echo "Docker version: $$(docker --version)"

# Check if Docker Compose is installed
check-compose:
	@echo "$(BLUE)Checking Docker Compose installation...$(RESET)"
	@if ! docker compose version >/dev/null 2>&1; then \
		echo "$(RED)Docker Compose is not installed$(RESET)"; \
		exit 1; \
	fi
	@echo "$(GREEN)Docker Compose is installed$(RESET)"

# Build and start containers
$(NAME):
	@echo "$(BLUE)Building and starting Docker containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) up --build -d
	@echo "$(GREEN)--- Docker containers are up and running ---$(RESET)"
	@echo "$(PURPLE)Access Application: http://localhost:4002$(RESET)"

# Stop containers
stop:
	@echo "$(YELLOW)Stopping Docker containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) stop
	@echo "$(GREEN)--- Docker containers stopped ---$(RESET)"

# Start containers
start:
	@echo "$(BLUE)Starting Docker containers...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) start
	@echo "$(GREEN)--- Docker containers started ---$(RESET)"

# Remove containers and networks
clean:
	@echo "$(YELLOW)Removing Docker containers and networks...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down --timeout 2
	@echo "$(GREEN)--- Clean completed ---$(RESET)"

# Remove everything including volumes and images
fclean: clean
	@echo "$(RED)Removing all Docker resources and data...$(RESET)"
	@docker compose -f $(COMPOSE_FILE) down -v --rmi all --timeout 2
	@docker system prune -a --volumes --force
	@echo "$(GREEN)--- Full clean completed ---$(RESET)"

# Show container status
status:
	@echo "$(BLUE)Docker containers status:$(RESET)"
	@docker compose -f $(COMPOSE_FILE) ps
	@echo "$(BLUE)Docker networks:$(RESET)"
	@docker network ls
	@echo "$(BLUE)Docker volumes:$(RESET)"
	@docker volume ls

# Show logs for all services
logs:
	@docker compose -f $(COMPOSE_FILE) logs

# Show logs for a specific service
logs-%:
	@docker compose -f $(COMPOSE_FILE) logs $*

# Rebuild everything
re: fclean all
	@echo "$(GREEN)--- Project rebuilt successfully ---$(RESET)"

# Install dependencies (Only backend needed now for Docker build context)
install:
	@echo "$(BLUE)Installing backend dependencies...$(RESET)"
	# @echo "$(YELLOW)Frontend dependencies:$(RESET)" # Removed
	# @cd $(FRONTEND_DIR) && npm install # Removed
	@echo "$(YELLOW)Backend dependencies:$(RESET)"
	@cd $(BACKEND_DIR) && npm install
	@echo "$(GREEN)Backend dependencies installed$(RESET)"

# Enter shell of a running container
shell-%:
	@docker compose -f $(COMPOSE_FILE) exec $* sh || echo "$(RED)Could not open shell for $*$(RESET)"

# Help command to display available commands
help:
	@echo "$(GREEN)Available commands:$(RESET)"
	@echo "  $(YELLOW)all$(RESET)       - Check requirements and start containers"
	@echo "  $(YELLOW)start$(RESET)     - Start containers"
	@echo "  $(YELLOW)stop$(RESET)      - Stop containers"
	@echo "  $(YELLOW)clean$(RESET)     - Remove containers and networks"
	@echo "  $(YELLOW)fclean$(RESET)    - Remove all Docker resources including volumes and images"
	@echo "  $(YELLOW)re$(RESET)        - Rebuild the project"
	@echo "  $(YELLOW)status$(RESET)    - Show container status"
	@echo "  $(YELLOW)logs$(RESET)      - Show logs for all services"
	@echo "  $(YELLOW)logs-X$(RESET)    - Show logs for service X (e.g., logs-backend)"
	@echo "  $(YELLOW)shell-X$(RESET)   - Open shell in service X (e.g., shell-backend)"
	@echo "  $(YELLOW)install$(RESET)   - Install backend dependencies"
	@echo "  $(YELLOW)help$(RESET)      - Show this help message"

.PHONY: all check-docker check-compose clean fclean re stop start status logs logs-% install shell-% help