# Docker Support

Docker is not required to run Bitcoin Node Hub, but the project ships with full Docker support for local workflows and app operations.

## Local development in this repository

Use this exact restart and install sequence from repository root:

```bash
docker compose down
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm install
docker compose up --build
docker compose up
```

## Run docs site locally

```bash
docker run --rm -it -p 5173:5173 -v "$(pwd):/app" -w /app node:24-slim npm run docs:dev
```

Or use Compose docs service:

```bash
docker compose up --build docs
```

## Build docs static output

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run docs:build
```

## Build app artifacts

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run build
```

## Run app in non-Docker environments

If you deploy without Docker, use your own runtime process management with equivalent environment variables and security controls.

At minimum, set:

- `NUXT_BITCOIN_NODE_CREDENTIALS` (required)
- `PORT` (optional)

See `/guide/configuration` for the credentials schema and `/guide/security` for deployment posture.

## Scope reminder

- Docker support in this repository covers app and docs workflows.
- Amplify deployment docs in `/guide/deployment-amplify` are only for the documentation site.
