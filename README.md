# Hidden Word Duel 🎯

A real-time 2-player word guessing game built with a modern full-stack architecture. Players are matched live, letters are revealed over time, and both players compete to guess the hidden word first.

This project was built with a focus on:

- Real-time systems design
- Server-authoritative gameplay
- Clean service-layer architecture
- Stability-first engineering

---

## ✨ Features

- ⚡ Real-time 2-player matchmaking (Socket.IO)
- ⏱ Server-authoritative tick engine
- 🔤 Progressive word reveal system
- 🧠 One-guess-per-tick gameplay rule
- 🤝 Draw detection on same-tick guesses
- 🏳️ Forfeit Win Handling
- 💾 Persistent match history (PostgreSQL + Prisma)
- 🧱 Service-layer modular backend
- 🛡 Frontend error boundaries for UI resilience

---

## 🧱 Tech Stack

### Frontend

- React + TypeScript
- React Router
- Socket.IO Client
- Context-based game state management

### Backend

- Node.js + Express
- Socket.IO (real-time layer)
- Prisma ORM
- PostgreSQL

### Tooling

- TypeScript (end-to-end)
- Modular service architecture
- In-memory active match store + DB persistence

---

## 🧠 Architecture Overview

### Server Authoritative Model

All gameplay logic lives on the server:

- Tick timing
- Word reveal engine
- Guess validation
- Round winners
- Match results

This prevents client-side cheating and keeps gameplay deterministic.

---

### Real-Time Game Flow

1. Player joins lobby
2. Matchmaking pairs two players
3. Server creates match in DB
4. Round starts with hidden word
5. Letters reveal on each tick
6. Players submit guesses (1 per tick)
7. Round ends on correct guess or full reveal
8. Match continues until win condition met

---

### Backend Architecture

```
server/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── config/
│   │   └── prisma.ts
│   ├── modules/
│   │   ├── game/
│   │   │   ├── guess.handler.ts
│   │   │   ├── guess.service.ts
│   │   │   ├── ready.store.ts
│   │   │   ├── round.factory.ts
│   │   │   ├── round.scheduler.ts
│   │   │   ├── round.service.ts
│   │   │   ├── round.store.ts
│   │   │   ├── tick.engine.ts
│   │   │   └── word.engine.ts
│   │   ├── lobby/
│   │   │   └── lobby.store.ts
│   │   ├── match/
│   │   │   ├── activeMatch.store.ts
│   │   │   └── match.service.ts
│   │   ├── player/
│   │   │   └── player.service.ts
│   │   └── sockets/
│   │       └── game.socket.ts
│   ├── types/
│   │   └── types.ts
│   └── index.ts
└── scripts/test-client.js
```

Key design decisions:

- Modular domain-based architecture (game, match, lobby, player)
- Clear separation of stores (in-memory) vs services (logic)
- Dedicated tick engine for real-time round progression
- Prisma isolated under config layer
- Socket registration separated from domain logic

---

### Persistence Model

Prisma models include:

- Player
- Match
- Round
- Guess

The database acts as the source of truth for completed matches while active matches live in memory for performance.

---

## 🎮 Frontend Architecture

```
client/src/
├── adapters/
│   └── round.adapter.ts
├── components/
│   ├── ErrorBoundary.tsx
│   ├── GuessInput.tsx
│   ├── MatchEndScreen.tsx
│   ├── PlayerStatus.tsx
│   ├── ReadyScreen.tsx
│   ├── RoundPlaying.tsx
│   ├── RoundResultScreen.tsx
│   ├── Scoreboard.tsx
│   ├── SystemNotice.tsx
│   ├── TileGrid.tsx
│   └── TimerBar.tsx
├── contexts/
│   └── GameContext.tsx
├── pages/
│   ├── LobbyPage.tsx
│   └── GamePage.tsx
├── socket/
├── styles/
│   └── globals.css
├── types/
│   ├── game.ts
│   └── socket.ts
├── utils/
│   └── player.utils.ts
└── App.tsx
```

Frontend highlights:

- Context-driven real-time state management
- Phase-based UI rendering (ready → playing → result)
- Adapter layer to normalize server payloads
- Route-scoped React Error Boundary for crash resilience
- Componentized round rendering system

Routes:

- `/` Lobby
- `/game` Gameplay

---

## 🛡 Stability & Reliability Decisions

This project prioritizes stability over premature abstraction.

Notable engineering decisions:

- Avoided heavy global refactors late in development
- Added process-level crash guards in the server entry point
- Used structured debugging instead of risky architectural churn
- Scoped React error boundaries around realtime routes

These decisions were made to maintain a stable real-time engine while iterating safely.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- npm or pnpm

---

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd hidden-word-duel
```

---

### 2️⃣ Backend Setup

```bash
cd server
npm install
```

Create `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/hiddenduel"
PORT=3000
```

Run migrations:

```bash
npx prisma migrate dev
```

Start server:

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd client
npm install
```
Create `.env`:

```
VITE_API_URL=http://localhost:5000
```
Start server:
```bash
npm run dev 
```
---

## 🧪 Future Improvements

- Global error abstraction layer
- Reconnect state reconciliation
- Spectator mode

---

## 🌐 Deployment Note

> ⚠️ **Backend Hosting Notice**\
> The backend is deployed on **Render (Free Tier)**.\
> Render free instances spin down after inactivity, which may cause the first request to take **30--50 seconds** to respond (cold start).
> If the game takes time to connect initially, please wait --- subsequent requests will be fast once the server wakes up.


