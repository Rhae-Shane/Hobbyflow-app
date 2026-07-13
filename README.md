# HobbyFlow App

**Go with your hobby's flow.**

React Native (Expo) client for HobbyFlow — AI-assisted hobby learning without YouTube rabbit holes. You get a short roadmap of techniques matched to your level and goal, open the right video/article/audio for each step, then master, skip, or replace what doesn’t fit.

Companion API: **[Hobbyflow-backend](https://github.com/Rhae-Shane/Hobbyflow-backend)** (Express + LangGraph). Point `EXPO_PUBLIC_API_URL` at that service.

---

## Stack

| Piece | Choice |
|-------|--------|
| Runtime | Expo SDK 54, React Native 0.81, React 19 |
| Routing | Expo Router |
| State / data | Zustand, TanStack Query, AsyncStorage (offline cache) |
| Auth & sync | Supabase Auth (email + Google) + Postgres via RLS |
| UI | Reanimated, FlashList, Lottie, custom fonts (DM Sans / Fraunces) |
| Observability | Sentry (`@sentry/react-native`) |
| Android builds | EAS (`preview` → APK) |

---

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- Expo Go (device) **or** Android emulator / iOS simulator
- A running [Hobbyflow-backend](https://github.com/Rhae-Shane/Hobbyflow-backend) (or deployed API URL)
- A Supabase project (same one the server uses)

---

## Quick start

```bash
cp .env.example .env
# Fill EXPO_PUBLIC_* values (see below)
npm install
npm start
```

Then press `a` / `i` / `w`, or scan the QR code with Expo Go.

**Physical device on LAN:** set `EXPO_PUBLIC_API_URL` to your machine’s LAN IP (e.g. `http://192.168.1.10:3000`), not `localhost`.

---

## Environment variables

Copy `.env.example` → `.env`. Never commit real secrets.

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend base URL (`http://localhost:3000` locally) |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon / publishable key (safe in the client) |
| `EXPO_PUBLIC_LOG_LEVEL` | No | `debug` \| `info` \| `warn` \| `error` (dev default: `debug`) |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Client Sentry DSN |

EAS `preview` / `production` profiles inject production API + Supabase values via `eas.json`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Open Android |
| `npm run ios` | Open iOS |
| `npm run web` | Open web |
| `npm test` | Jest unit / component tests |

---

## Supabase Auth (Dashboard)

Under **Authentication → URL Configuration**, add:

- `hobbyflow://auth/callback`
- `hobbyflow://**`
- `exp://127.0.0.1:8081` (Expo Go local)

Enable **Email** and **Google** under **Authentication → Providers**.

Storage buckets (`post-media`, `lesson-media`) come from server migrations — apply them from **hobbyflow-server** (`npm run db:push`).

---

## Project layout

```
app/                 # Expo Router screens (auth, tabs, roadmap, feed, …)
components/          # UI by feature (roadmap, pact, onboarding, …)
lib/                 # API clients, prefs, helpers
services/            # Supabase + domain services
store/               # Zustand stores
hooks/               # Shared hooks
constants/           # Theme / design tokens
types/               # Shared TS types
```

Main tabs: Home, Explore, Generate, Courses, Feed, Progress, Profile. Flows include onboarding preferences, roadmap creation chat, lesson/technique detail, Pact / streak, daily tasks, and leaderboard.

---

## Android APK (EAS)

```bash
npx eas-cli login
npx eas-cli build --profile preview --platform android
```

The `preview` profile builds an **APK** aimed at the deployed API (see `eas.json`). For source maps, set `SENTRY_AUTH_TOKEN` as an EAS secret and remove `SENTRY_DISABLE_AUTO_UPLOAD` from `eas.json` when ready.

---

## Offline & sync

- Plans and progress cache in **AsyncStorage** so the UI works offline.
- When online, the app syncs with **Supabase** (user session + RLS).
- AI generation / replace / chat always go through **hobbyflow-server**.

---

## Related repo

| Repo | Role |
|------|------|
| [Hobbyflow-backend](https://github.com/Rhae-Shane/Hobbyflow-backend) | Express API, LangGraph lesson/roadmap generation, Supabase migrations |

Start the server first for local full-stack work; health check: `GET http://localhost:3000/health`.
