# Local Docker Workflow

This repository uses a strict Docker-first local workflow for contributors and maintainers.

Docker is not required for all possible runtime deployments of Bitcoin Node Hub, but this repository standardizes local development and verification commands through Docker.

## Required restart and install sequence

Run this exact sequence from the repository root:

```bash
docker compose down
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm install
docker compose up --build
docker compose up
```

## Run docs locally

Use Dockerized Node commands only:

```bash
docker run --rm -it -p 5173:5173 -v "$(pwd):/app" -w /app node:24-slim npm run docs:dev
```

Or start the dedicated Compose docs service (recommended for Docker Desktop play/stop):

```bash
docker compose up --build docs
```

Docs dev URL:

`http://localhost:3201`

## Run the app locally with Compose

Use the app development service:

```bash
docker compose up --build
docker compose up
```

The app is available at:

`http://localhost:3000`

## Build docs locally

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run docs:build
```

The generated static files are written to docs/.vitepress/dist.

## Related docs

- Docker support and deployment notes: `/guide/docker`
- Security guidance before deployment: `/guide/security`
- Docs-only hosting with Amplify: `/guide/deployment-amplify`
