import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.DEV_AUTH_SERVER_PORT || 8787;

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;

console.log({ clientId, clientSecret })

app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      process.env.DEV_AUTH_ALLOWED_ORIGIN!,
    ].filter(Boolean),
    credentials: false,
  }),
);
app.use(express.json());

app.options('/oauth/github-token', (_req, res) => {
  res.sendStatus(204);
});

app.post('/oauth/github-token', async (req, res) => {
  try {
    const { code, redirect_uri: redirectUri } = req.body || {};
    if (!code || !redirectUri) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code and redirect_uri are required',
      });
    }

    if (!clientId || !clientSecret) {
      return res.status(500).json({
        error: 'missing_credentials',
        error_description: 'GitHub OAuth credentials not configured',
      });
    }

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      return res.status(400).json(tokenData);
    }

    return res.status(200).json(tokenData);
  } catch (error) {
    return res.status(500).json({
      error: 'token_exchange_failed',
      error_description:
        error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Dev auth server listening on http://localhost:${PORT}`);
});
