# Vercel Spring Boot + Next.js + Neon Demo

## Goal

Create the smallest useful demo proving that a native Next.js frontend and a Dockerized Spring Boot backend can deploy together on Vercel Services and persist messages in Neon Postgres.

## Architecture

The repository contains two services behind one Vercel deployment and domain:

- `frontend/`: a Next.js App Router application deployed with Vercel's native Next.js runtime.
- `backend/`: a Spring Boot HTTP application built from `backend/Dockerfile.vercel` and deployed as a container service.

Top-level `vercel.json` routes `/api/*` to the backend and all other paths to the frontend. The browser therefore uses same-origin API requests and needs no CORS configuration.

Neon's Vercel integration supplies `DATABASE_URL`. Spring prefixes the standard Neon PostgreSQL URL with `jdbc:` in application configuration so the PostgreSQL JDBC driver can use it.

## Behavior

The frontend displays one labeled text field, a submit button, status or error text, and the persisted message list. It loads messages on page load and refreshes the list after a successful submission.

The backend exposes:

- `GET /api/messages`: return up to 50 newest messages as JSON.
- `POST /api/messages`: accept JSON containing `text`, reject blank values or values over 200 characters with HTTP 400, insert the message, and return the inserted row.

The backend initializes the single `messages` table idempotently at startup. This is acceptable for a deployment demo and avoids a migration dependency.

## Data

The `messages` table contains an auto-generated numeric ID, message text, and creation timestamp. All SQL uses parameters. The API returns only those three fields.

## Errors

Input validation happens at the backend trust boundary. Unexpected backend failures use Spring's normal HTTP 500 response. The frontend shows a short error message when loading or submission fails and keeps the entered text after a failed submission.

## Verification

- A small backend test checks the validation branch.
- Gradle tests compile and exercise the Kotlin backend.
- The Next.js production build checks the frontend.
- A Docker build checks `backend/Dockerfile.vercel` when Docker is available.
- The README documents the live smoke test: connect Neon, deploy through Vercel Services, add a message, and reload to confirm persistence.

## Deliberate Omissions

No JPA, migration framework, authentication, pagination, editing, deletion, Docker Compose, shared client package, or design system. Add them only if the demo becomes a real application.
