# 42 Transcendence Frontend

A single-page application built with TypeScript and Tailwind CSS.

## Requirements

- Docker
- Latest Firefox browser

## Development

To start the development environment:

```bash
docker-compose up
```

This will:
- Build the frontend container
- Start the application on port 4001 (served through the backend)
- Enable hot-reload for both TypeScript and Tailwind CSS

## Project Structure

```
frontend/
├── src/
│   ├── index.html      # Main HTML entry point
│   ├── main.ts         # TypeScript entry point
│   └── styles/
│       └── input.css   # Tailwind CSS entry point
├── Dockerfile
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Features

- Single-page application architecture
- TypeScript for type-safe JavaScript
- Tailwind CSS for styling
- Browser history support (back/forward navigation)
- Hot-reload development environment 