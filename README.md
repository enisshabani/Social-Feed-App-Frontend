# KaPak Frontend

KaPak Frontend is the React client for the KaPak distributed social feed application. It connects to the FastAPI backend through REST APIs and provides the user interface for authentication, feeds, posting, media upload, search, follows, notifications, settings, and AI-assisted post tools.

The frontend is built with **React**, **TypeScript**, **Vite**, **React Router**, **Axios**, **Firebase Auth providers**, and **Context API**.

## Project Architecture

The full system is split into two independent applications:

- `Social-Feed-App-Frontend` - React client application
- `Social-Feed-App-Backend` - FastAPI REST API

The frontend never accesses the database directly. All data is loaded and updated through HTTP API calls to the backend.

## Main Features

- Login, register, email verification, password reset, OAuth login, and 2FA screens
- Protected routes for authenticated users
- Home feed, explore/search, bookmarks, hashtag feeds, and profile timelines
- Create, edit, delete, like, react, repost, bookmark, and comment on posts
- Media upload, media preview, image cropping, and media lightbox
- Poll creation and voting
- Search across posts, users, and hashtags
- Follow/unfollow users and view followers/following lists
- Notifications page with unread state, filtering, clearing, and preferences
- Theme, language, auth, follow, and notification state managed with Context API
- AI-assisted hashtag suggestions and sentiment display

## Context Providers

The app uses React Context API for shared state:

- `AuthContext` - logged-in user, token, login/logout, profile updates
- `ThemeContext` - theme state
- `LanguageContext` - language selection and translations
- `FollowContext` - follow/unfollow state
- `NotificationContext` - notifications, unread count, read/delete/clear actions

These providers are wired in `src/main.tsx`.

## API Communication

The frontend communicates with the backend using Axios clients in:

```text
src/services/api.ts
src/apiClient.ts
```

Feature-specific API wrappers are in:

```text
src/services/post.service.ts
src/services/search.service.ts
src/services/ai.service.ts
src/modules/follows/api/followsApi.ts
src/modules/notifications/api/notificationsApi.ts
```

By default, the app expects the backend at:

```text
http://localhost:8000
```

If needed, configure the backend URL with environment variables such as:

```env
VITE_API_URL=http://localhost:8000
```

## Pages And Routes

Important routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`
- `/feed`
- `/feed?tab=bookmarks`
- `/feed?tag=example`
- `/search`
- `/hashtag/:name`
- `/profile`
- `/profile/:username`
- `/notifications`
- `/settings`
- `/followers/:userId`
- `/following/:userId`

Routing is defined in `src/App.tsx`.

## Setup

Install dependencies:

```bash
cd Social-Feed-App-Frontend
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

## Backend Requirement

Start the backend in another terminal:

```bash
cd ../Social-Feed-App-Backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API documentation:

```text
http://localhost:8000/docs
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript build checks and creates a production build.

```bash
npm run lint
```

Runs ESLint.

```bash
npm run preview
```

Previews the production build locally.

## Repository Structure

```text
src/
  components/        Shared UI components such as posts, sidebars, composer, action bar
  context/           Auth, theme, and language providers
  modules/           Feature modules for follows and notifications
  pages/             Route-level screens
  services/          API clients and feature API wrappers
  styles/            Global styling
  utils/             Asset URL and media helpers
```

## Distributed Systems Requirements Covered

This frontend supports the distributed project requirements by providing:

- A separate client application independent from the backend
- HTTP/REST communication through Axios
- React + Context API state management
- Authentication-aware protected routes
- Search and filtering UI
- Notification UI
- AI feature UI for hashtag suggestions and sentiment analysis
- Integration with backend media, feed, follow, and notification APIs

## Notes

The backend is responsible for persistence, authorization, caching, background jobs, AI calls, and multi-tenancy. The frontend is responsible for presentation, user interaction, client-side state, routing, and API integration.
