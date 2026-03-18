# Deploy Docs to AWS Amplify

> This page is for deploying the VitePress documentation site only.
>
> It does not deploy the Bitcoin Node Hub application runtime.

Deploy docs as a separate Amplify app from the same repository.

## Amplify setup

1. Create a new Amplify app and connect this repository.
2. Leave monorepo mode disabled.
3. Use a docs-only build spec:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run docs:build
  artifacts:
    baseDirectory: docs/.vitepress/dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

## Subdomain mapping

1. Open Domain management in the docs Amplify app.
2. Add subdomain docs to the selected branch.
3. Wait for certificate provisioning and DNS validation.

Docs deployment is independent of the main application hosting platform.

If you are looking for app runtime deployment guidance, use `/guide/docker` and `/guide/security`.

## Production-ready checklist

Use this checklist before go-live.

### Repository and branch

1. Confirm the docs content is merged into the production branch.
2. Confirm `package.json` includes `docs:build` script.
3. Confirm docs build output path is `docs/.vitepress/dist`.

### Amplify app configuration

1. App type: Host web app.
2. Repository: this repository.
3. Monorepo mode: disabled.
4. Build image runtime: Node 20+ available.
5. Build spec uses `npm ci` and `npm run docs:build`.
6. Artifact base directory is `docs/.vitepress/dist`.
7. Auto build is enabled for your production branch.

### Domain and DNS

1. Add subdomain `docs` for the production branch.
2. Validate DNS records in your DNS provider.
3. Wait for SSL certificate issuance to complete.
4. Confirm HTTPS loads without certificate warnings.

### Verification gates

1. Confirm homepage and guide pages render correctly.
2. Confirm internal links do not 404.
3. Confirm browser hard refresh works on deep links.
4. Confirm no secrets are referenced in docs content.
5. Confirm rebuild succeeds after a no-op commit to docs branch.

### Operations

1. Keep Amplify build settings docs-only and isolated from app hosting.
2. Re-run docs build locally in Docker before release changes:

```bash
docker run --rm -it -v "$(pwd):/app" -w /app node:24-slim npm run docs:build
```

3. If you later add root `amplify.yml`, verify it does not break docs app build settings.

## Scope reminder

- This Amplify flow publishes static files from `docs/.vitepress/dist`.
- The Bitcoin Node Hub app runtime is a separate deployment concern.
- Keep docs deployment credentials and infrastructure isolated from app runtime infrastructure.
