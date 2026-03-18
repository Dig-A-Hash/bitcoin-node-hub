# Docker Support

Docker is not required to run Bitcoin Node Hub, but the project ships with full Docker support for local workflows and app operations.

## Create Production Build

The Bitcoin Node Hub build will be placed in the .output directory.

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run build
```

The command to run the Bitcoin Node Hub after building is simple.

`node .output/server/index.mjs`

## Run the app locally with Compose

Use the app development service:

```bash
docker compose up --build
docker compose up
```

## Install NPM Packages using Docker

This is useful for development purposes as it will allow the IDE to find packages, and autocomplete function calls from the required packages.

```bash
docker compose down
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm install
docker compose up --build
docker compose up
```



## Run Docs Site Locally

```bash
docker compose up --build docs
```

## Build Docs Static Output

This will create a static website for the docs in the docs/dist directory.

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run docs:build
```


