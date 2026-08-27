# Next.js + Spring Boot + Neon on Vercel

A minimal Vercel Services demo: native Next.js, a Spring Boot container built from `backend/Dockerfile.vercel`, and Neon Postgres.

## Deploy

Prerequisites: Git, Docker, Node.js 20.9+, Java 21, and the Vercel CLI.

1. Push this folder to a Git repository and import it into Vercel.
2. In **Project Settings → Build and Deployment**, set **Framework Preset** to **Services**.
3. Add Neon from **Vercel Marketplace → Storage** and connect it to this project. It supplies `DATABASE_URL`.
4. Deploy the project. Vercel uses `vercel.json` to serve Next.js at `/` and the Spring container at `/api/*`.
5. Save a message, reload, and confirm it remains.

The same setup is available from the CLI after linking the folder:

```sh
vercel link
vercel integration add neon
vercel env pull .env.local --yes
vercel deploy
```

## Run locally

With Docker running and a real `DATABASE_URL` in `.env.local`:

```sh
npm install --prefix frontend
vercel dev -L
```

Open <http://localhost:3000>. The backend creates the `messages` table automatically.

## Checks

```sh
./backend/gradlew -p backend test
npm --prefix frontend run build
docker build -f backend/Dockerfile.vercel backend


```
