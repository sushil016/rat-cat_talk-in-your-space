# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

**RatCat** is a real-time synchronized watch-party platform (like Teleparty + Discord). Users create private "Watch Rooms" via a unique link and watch YouTube or uploaded videos in perfect sync with voice and text chat.

## Commands

```bash
# Development (Next.js only)
npm run dev

# Development (Next.js + Socket.io server together)
npm run dev:all

# Socket.io server only
npm run socket:dev

# Build for production
npm run build

# Lint
npm run lint

# Prisma: generate client after schema changes
npx prisma generate

# Prisma: run migrations
npx prisma migrate dev --name <migration-name>

# Prisma: open Prisma Studio
npx prisma studio
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_SOCKET_URL` — Socket.io server URL (default: `http://localhost:3001`)
- OAuth credentials for GitHub, Google, Discord

## Architecture

This project runs **two separate servers** that must both be running during development:
1. **Next.js app** (`localhost:3000`) — handles UI, API routes, auth
2. **Socket.io server** (`localhost:3001`, `server/index.ts`) — handles all real-time events

### Route Groups

- `app/page.tsx` — Public marketing landing page
- `app/(auth)/` — Sign-in / Sign-up pages (NextAuth)
- `app/(dashboard)/` — Protected app pages with sidebar layout
  - `/dashboard` — Home after login
  - `/rooms` — List of user's rooms
  - `/rooms/new` — Create a room
  - `/rooms/[roomId]` — Room lobby (waiting screen)
  - `/rooms/[roomId]/watch` — Active watch party (video + chat + voice)
  - `/rooms/[roomId]/space` — 2D spatial space feature
  - `/friends` — Friends management
  - `/profile` — User profile
- `app/join/[code]` — Join room by code (auth required)
- `app/r/[code]` — Short redirect link for room sharing

### Real-time Architecture

All real-time state flows through **Socket.io** (`server/index.ts`). The socket server maintains in-memory state only — no DB writes for real-time events:
- `rooms` Map — participant lists per room
- `roomChats` Map — chat history per room (capped at 200 messages)
- `spacePlayers` Map — 2D space positions per room

Client-side socket state is managed by **Zustand** (`store/useRoomStore.ts`). Components connect/disconnect the socket via `lib/socket.ts` (singleton pattern).

Key socket events: `join-room`, `toggle-play`, `sync-time`, `set-media`, `send-message`, `voice-signal`, `space-move`.

### Room Components (`components/room/`)

The watch page (`/rooms/[roomId]/watch`) assembles these components:
- `VideoPlayer` — YouTube iframe or HTML5 video with sync logic
- `ControlsBar` — Play/pause/seek/media controls (host only can control)
- `ChatSidebar` — Real-time chat with reactions and floating emojis
- `VoiceChannel` — WebRTC voice chat using `simple-peer`
- `FloatingEmojis` — Animated emoji overlays on the video

### Auth

NextAuth v5 (beta) with JWT strategy. Two config files:
- `lib/auth.config.ts` — Edge-compatible config used by middleware for route protection
- `lib/auth.ts` — Full config with Prisma adapter and OAuth providers

Middleware (`middleware.ts`) protects all routes except `/`, `/sign-in`, `/sign-up`, `/join/*`, `/r/*`, and `_next` static files.

### Database

Prisma + PostgreSQL. Schema at `prisma/schema.prisma`. Prisma client is generated to `app/generated/prisma/` (non-standard output location).

Key models: `User`, `Room` (has `code` + `slug`), `Participant`, `Message`, `Friendship`, `Account`/`Session` (NextAuth).

### UI

shadcn/ui components in `components/ui/`. Brand colors: yellow `#ffd063` + blue `#00a6ff` on black background. Fonts: Manrope (primary) + Inter. Dark mode forced (`className="dark"` on `<html>`).
