# 42 Transcendence

## Description
42 Transcendence is a full-stack web application featuring a multiplayer Pong game, user authentication, real-time chat, and social features. The project is built with a Fastify backend (TypeScript) and a modern frontend using TypeScript and Tailwind CSS. It demonstrates best practices in containerized development, modular architecture, and scalable design.

## Installation Instructions

### Prerequisites
- Docker
- Node.js (if running outside Docker)
- npm (if running outside Docker)

### Setup (Recommended: Docker Compose)
```bash
git clone https://github.com/axellee1994/ft_transcendence.git
cd ft_transcendence
docker-compose up --build
```
This will build and start both backend and frontend containers. The frontend is served via the backend on port 4001.

### Manual Setup (Development)
#### Backend
```bash
cd backend
npm install
npm run dev
```
By default, backend runs on http://localhost:3000

#### Frontend
```bash
cd frontend
npm install
npm run start
```
By default, frontend runs on http://localhost:4000

## Usage Instructions
- Access the application at [http://localhost:4001](http://localhost:4001) when using Docker Compose.
- Register or log in to start playing Pong, chat with friends, and explore user profiles.
- Use the navigation bar to switch between game, chat, and profile sections.

### Example Commands
To run tests:
```bash
# Backend
docker-compose exec backend npm run test
# Frontend
docker-compose exec frontend npm run test
```

## Contribution Guidelines
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the coding standards (TypeScript, Prettier, ESLint where applicable).
4. Write clear commit messages.
5. Ensure all tests pass before submitting.
6. Submit a pull request with a detailed description.

Please refer to the `CONTRIBUTING.md` if available for more details.

## License Information
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact Information
For questions or support, please contact:
*   **Author(s):** axellee1994 - [https://github.com/axellee1994](https://github.com/axellee1994)
*   **Project Link:** [https://github.com/axellee1994/ft_transcendence](https://github.com/axellee1994/ft_transcendence)

---

Thank you for using and contributing to **ft_transcendence**! If you find this project helpful, please consider starring the repository or submitting improvements.
