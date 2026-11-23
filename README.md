# Sylvaire Website

Website for the Sylvaire Minecraft community: a forum, a wiki, player profiles, leaderboards, a live server map and a 3D skin viewer. Built with Next.js and talks to the game server's API.

## Features

- **Feed and forum** with posts, comments, notifications and a forum leaderboard
- **Wiki** where members can create and edit articles
- **Player profiles** with a 3D skin preview (skinview3d + Three.js)
- **Leaderboards and participants list**
- **Organizations** page
- **Live map** embedded from BlueMap
- **Admin area** with action logs and a maintenance mode
- Login through the server API and toast notifications

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Three.js, skinview3d, react-skinview3d
- Sonner for notifications

## Run Locally

```bash
npm install
cp .env.example .env     # set NEXT_PUBLIC_BLUEMAP_URL
npm run dev
```

The site opens at `http://localhost:3000`. API requests go to the same domain by default (a reverse proxy forwards `/api/*` to the Minecraft server). To use another backend, set `NEXT_PUBLIC_API_URL`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | development server |
| `npm run build` | production build |
| `npm run start` | run the production build |
| `npm run lint` | ESLint |
