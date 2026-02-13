# Visha — Video Chat Platform

> Connect with people, play games, and have real conversations.

## Overview

Visha is a real-time video chat platform built with WebRTC peer-to-peer connections. It features random matchmaking, in-call text chat, and 14 interactive games you can play with your match or against AI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · TypeScript · Vite |
| **Styling** | Tailwind CSS · shadcn/ui |
| **Real-time** | Socket.io · WebRTC |
| **Server** | Express · Node.js |

## Project Structure

```
vishachat/
├── src/                  # React frontend (client)
│   ├── components/       # UI components (shadcn/ui + custom)
│   ├── pages/            # Route pages (Landing, Lobby, VideoChat, Games)
│   ├── hooks/            # Custom hooks (WebRTC, matchmaking, media)
│   ├── context/          # React Context (app state)
│   ├── lib/              # Socket client & utilities
│   ├── data/             # Static data (games list, mock users)
│   └── types/            # TypeScript type definitions
│
├── server/               # Express + Socket.io signaling server
│   └── src/
│       ├── index.js      # Server entry point
│       ├── socketHandler.js  # Connection & signaling logic
│       ├── presence.js   # User presence tracking
│       └── store.js      # In-memory state
│
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── package.json          # Frontend dependencies
```

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 9

### 1. Clone the repository

```bash
git clone https://github.com/bremin184/vishachat.git
cd vishachat
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Install dependencies

```bash
# Frontend
npm install

# Server
cd server && npm install && cd ..
```

### 4. Start development

```bash
# Terminal 1: Start the signaling server
cd server && npm run dev

# Terminal 2: Start the frontend
npm run dev
```

The frontend will be available at `http://localhost:8080`.

## Available Scripts

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |

### Server

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (auto-reload) |

## Features

- **HD Video Chat** — WebRTC peer-to-peer video calls
- **Smart Matching** — Dynamic random or gender-preference matching
- **Text Chat** — Real-time messaging during video calls
- **14 Games** — Tic Tac Toe, Chess, Connect Four, Trivia, and more
- **AI Opponents** — Play games solo against AI

## License

MIT
