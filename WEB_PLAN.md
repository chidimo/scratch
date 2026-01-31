# Web App + Token Exchange Function Plan

## Goals

- Add a React + Vite web app in the monorepo.
- Add a serverless function to exchange GitHub OAuth codes for tokens.
- Deploy both on Netlify with secure environment variables.

## Repository Structure (proposed)

```
apps/
  web/
    src/
    index.html
    package.json
    vite.config.ts
    netlify.toml
netlify/
  functions/
    github-token.ts
```

## Plan

### 1) Scaffold the Vite app

- Create `apps/web` with Vite React + TypeScript.
- Align linting/formatting with the monorepo.
- Add a simple landing page with a “Sign in with GitHub” button.

### 2) Add the OAuth token exchange function

- Create `netlify/functions/github-token.ts`.
- Function accepts `POST { code, redirect_uri }`.
- Function calls GitHub OAuth token endpoint using server-side `client_secret`.
- Returns JSON `{ access_token, token_type, scope }`.
- Add basic validation and error handling.

### 3) Wire the web app to the function

- In the web app, call the Netlify function endpoint instead of GitHub directly.
- Add env var for `VITE_GITHUB_CLIENT_ID`.
- Use the same redirect path as the web app route.

### 4) Configure Netlify deployment

- Add `netlify.toml` with:
  - build command for `apps/web`
  - publish directory for Vite output
  - functions directory set to `netlify/functions`
- Add Netlify environment variables:
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`

### 5) Update GitHub OAuth app settings

- Add redirect URLs for:
  - Local web dev: `http://localhost:5173/auth/callback`
  - Netlify web prod: `https://<your-site>.netlify.app/auth/callback`
- Keep Expo app redirect URLs separate.

### 6) Docs + smoke test

- Document env vars in `.env.example` for web.
- Add a short “How to run web” section to `README.md`.
- Test local web login end-to-end:
  - authorize → code → function exchange → profile fetch.

## Deliverables

- `apps/web` Vite app with OAuth UI.
- `netlify/functions/github-token.ts` working locally.
- Netlify config + env var docs.
