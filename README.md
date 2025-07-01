# 42 Transcendence

## Description
42 Transcendence is a full-stack web application featuring a multiplayer Pong game, user authentication, real-time chat, and social features. The project is built with a Fastify backend (TypeScript) and a modern frontend using TypeScript and Tailwind CSS. It demonstrates best practices in containerized development, modular architecture, and scalable design.

## Features

- **Real-time Multiplayer Pong:** Challenge friends or other users to a classic game of Pong.
- **User Authentication:** Secure user registration and login using JWT and Google OAuth2.
- **Social Features:** Add friends, view user profiles, and see their match history.
- **Real-time Chat:** Communicate with other players in real-time.
- **Tournament Mode:** Compete in tournaments to become the ultimate Pong champion.

## Technologies Used

- **Backend:** Fastify, TypeScript, Node.js, SQLite, Nodemailer
- **Frontend:** TypeScript, Webpack, Tailwind CSS, Babylon.js
- **DevOps:** Docker

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

### Environment Variables

To run the application, you need to set up the environment variables. In the `backend` directory, create a file named `.env` and copy the contents from `.env.example`. You will need to provide your own values for the following:

- `SMTP_USER`: Your SMTP email address for sending emails.
- `SMTP_PASS`: Your SMTP password.
- `HASHING_SECRET`: A secret key for hashing.
- `JWT_SECRET`: A secret key for JWT.
- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret.

This ensures that your sensitive credentials are not exposed in the repository.

#### Obtaining Your Own Credentials

- **`SMTP_USER` & `SMTP_PASS`**: These are for sending emails. You'll need to use your own email provider's SMTP details. For Gmail, you can generate an "App Password" from your Google account security settings.

- **`HASHING_SECRET` & `JWT_SECRET`**: These are for security. Generate long, random strings for these. You can use a password manager or run the following command in your terminal to create a secure secret:
    ```bash
    openssl rand -hex 32
    ```

- **`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`**: To get these, you must create a project in the [Google Cloud Console](https://console.cloud.google.com/):
    1.  Create a new project.
    2.  Navigate to "APIs & Services" > "Credentials".
    3.  Click "Create Credentials" and choose "OAuth 2.0 Client ID".
    4.  Select "Web application" as the application type.
    5.  Add `http://localhost:4000` to "Authorized JavaScript origins".
    6.  Add `http://localhost:3000/api/auth/google/callback` to "Authorized redirect URIs".
    7.  Create the client ID. Google will provide you with the Client ID and Client Secret to add to your `.env` file.

### Common Docker Commands

Here are some common commands to manage your application with Docker Compose:

- **Start the application in detached mode:**
  ```bash
  docker-compose up -d
  ```

- **Follow the logs of all services:**
  ```bash
  docker-compose logs -f
  ```

- **Follow the logs of a specific service (e.g., backend):**
  ```bash
  docker-compose logs -f backend
  ```

- **Run tests for the backend:**
  ```bash
  docker-compose exec backend npm run test
  ```

- **Stop and remove the containers:**
  ```bash
  docker-compose down
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
