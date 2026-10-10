# Commonplace Blog

A small full stack blog built with Node.js, Express, Prisma, and PostgreSQL. Express serves both the REST API and the static HTML/CSS/JavaScript frontend.

## Requirements

- Node.js 20 or newer
- Docker Desktop (or Docker Engine) with Compose

## Run locally

1. Copy `.env.example` to `.env` and set `JWT_SECRET` to a random value of at least 32 characters. Keep `DATABASE_URL` in sync with the `DB_*` settings.
2. Start PostgreSQL: `docker compose up -d db`
3. Install dependencies: `npm install`
4. Generate Prisma Client: `npm run db:generate`
5. Create the local database schema: `npm run db:migrate -- --name init`
6. Start the app: `npm run dev`
7. Open [http://localhost:3000](http://localhost:3000).

Compose uses the `DB_*` settings from `.env`; the database is exposed on `DB_PORT` (5432 by default) and persisted in the `blog-postgres-data` Docker volume. To stop PostgreSQL, run `docker compose down`. Removing stored data requires explicitly removing that volume.

## Build and run the app with Docker

Build the production image:

```sh
docker build -t commonplace-blog .
```

Run it with a `.env` file:

```sh
docker run --rm -p 3000:3000 --env-file .env commonplace-blog
```

The `DATABASE_URL` must point to a database reachable from inside the container. For a PostgreSQL instance started with this project's Compose file, use `host.docker.internal` instead of `localhost` as the database host, and use the published `DB_PORT`. The image does not contain `.env` files or the local `node_modules` directory.

## API

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an account and start a session |
| `POST` | `/api/auth/login` | Public | Start a session |
| `POST` | `/api/auth/logout` | Public | Clear the session cookie |
| `GET` | `/api/auth/me` | Public | Return the current user, if logged in |
| `GET` | `/api/posts?q=term` | Public | Browse and search posts |
| `GET` | `/api/posts/:id` | Public | Read a post and its comments |
| `POST` | `/api/posts` | Logged in | Create a post |
| `PUT` | `/api/posts/:id` | Post author | Edit a post |
| `DELETE` | `/api/posts/:id` | Post author | Delete a post and its comments |
| `POST` | `/api/posts/:postId/comments` | Logged in | Add a comment |

Sessions use an HTTP-only, same-site cookie. Passwords are stored as bcrypt hashes. Comments are available to authenticated readers; post creation, editing, and deletion require the author. The frontend inserts user-generated content as text, not HTML.

For production, configure a strong unique `JWT_SECRET`, set `NODE_ENV=production` behind HTTPS, and replace the sample database credentials with managed secrets.
