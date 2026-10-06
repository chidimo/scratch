import { Handler } from '@netlify/functions';

type ClientKind = 'web' | 'mobile';

interface TokenRequest {
  code: string;
  redirect_uri: string;
  code_verifier?: string;
  // Which GitHub OAuth app to exchange with. Defaults to the web app.
  client?: ClientKind;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  body: JSON.stringify(body),
});

const getCredentials = (client: ClientKind) =>
  client === 'mobile'
    ? {
        clientId: process.env.GITHUB_MOBILE_CLIENT_ID,
        clientSecret: process.env.GITHUB_MOBILE_CLIENT_SECRET,
      }
    : {
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      };

// Never log request headers, authorization codes, tokens or secrets here.
const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    if (!event.body) {
      throw new Error('Request body is required');
    }

    const {
      code,
      redirect_uri,
      code_verifier,
      client = 'web',
    }: TokenRequest = JSON.parse(event.body);

    if (!code) {
      throw new Error('Authorization code is required');
    }

    if (!redirect_uri) {
      throw new Error('Redirect URI is required');
    }

    if (client !== 'web' && client !== 'mobile') {
      throw new Error('Unsupported client');
    }

    const { clientId, clientSecret } = getCredentials(client);

    if (!clientId || !clientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
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
          code: code,
          redirect_uri: redirect_uri,
          ...(code_verifier ? { code_verifier } : {}),
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json()) as ErrorResponse;
      throw new Error(
        `GitHub API error: ${errorData.error_description || errorData.error}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as TokenResponse;
    return json(200, tokenData);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('OAuth token exchange failed:', errorMessage);

    return json(400, {
      error: 'token_exchange_failed',
      error_description: errorMessage,
    });
  }
};

export { handler };
