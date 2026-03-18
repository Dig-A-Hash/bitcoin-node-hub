# Authentication

Authentication is optional and controlled by `ADMIN_PASSWORD_HASH`.

## Configure auth first (.env or environment variables)

Set auth values either in your `.env` file or by exporting environment variables before starting the app.

Use `.env` (recommended for local development):

```bash
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters
ADMIN_PASSWORD_HASH=replace-with-generated-hash
```

Or set variables in your shell/session:

```bash
export NUXT_SESSION_PASSWORD='replace-with-at-least-32-characters'
export ADMIN_PASSWORD_HASH='replace-with-generated-hash'
```

To disable authentication, leave `ADMIN_PASSWORD_HASH` empty or unset.

## Behavior

- If `ADMIN_PASSWORD_HASH` is set, login is required for all routes except `/login`.
- If `ADMIN_PASSWORD_HASH` is empty or unset, app authentication is disabled.

When enabling authentication, set `NUXT_SESSION_PASSWORD` to a strong value (minimum 32 characters).

## Session lifetime

Session lifetime is configured in runtime config (`session.maxAge`) in `nuxt.config.ts`.

- Unit: seconds
- Current default in this project: `60 * 60 * 24 * 30` (30 days)

## Environment values

```bash
NUXT_SESSION_PASSWORD=replace-with-at-least-32-characters
ADMIN_PASSWORD_HASH=
```

## Generate ADMIN_PASSWORD_HASH

Use Docker to generate a hash without storing plaintext passwords in project files:

```bash
docker compose run --rm dev node -e 'import("@adonisjs/hash").then(async ({ Hash }) => { const { Scrypt } = await import("@adonisjs/hash/drivers/scrypt"); const password = process.argv[1]; if (!password) throw new Error("Pass password as the first argument."); const hash = new Hash(new Scrypt({})); console.log(await hash.make(password)); })' "replace-with-strong-password"
```

Use the full command output as `ADMIN_PASSWORD_HASH`.

## Operational notes

- Restart runtime after changing auth variables.
- Keep session password and hash values secret.
- Use authentication alongside network restrictions, not as a replacement for them.

See `/guide/security` for deployment posture.
