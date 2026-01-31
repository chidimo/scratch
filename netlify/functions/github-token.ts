import { Handler } from '@netlify/functions';

interface TokenRequest {
  code: string;
  redirect_uri: string;
  code_verifier?: string;
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

const handler: Handler = async (event) => {
  console.log('🔍 OAuth function called');
  console.log('📥 Request method:', event.httpMethod);
  console.log('📥 Request headers:', event.headers);

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: '',
    };
  }

  // Only allow POST requests for token exchange
  if (event.httpMethod !== 'POST') {
    console.log('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Validate request body
    if (!event.body) {
      console.log('❌ No request body');
      throw new Error('Request body is required');
    }

    const { code, redirect_uri, code_verifier }: TokenRequest = JSON.parse(
      event.body,
    );
    console.log('📋 Parsed request body:', {
      code: code ? `${code.substring(0, 10)}...` : 'null',
      redirect_uri,
      code_verifier: code_verifier ? '***PRESENT***' : 'null',
    });

    if (!code) {
      console.log('❌ No authorization code');
      throw new Error('Authorization code is required');
    }

    if (!redirect_uri) {
      console.log('❌ No redirect URI');
      throw new Error('Redirect URI is required');
    }

    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    console.log('🔑 Environment check:', {
      clientId: clientId ? `${clientId.substring(0, 10)}...` : 'null',
      clientSecret: clientSecret ? '***CONFIGURED***' : 'null',
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

    if (!clientId || !clientSecret) {
      console.log('❌ Missing OAuth credentials');
      throw new Error('GitHub OAuth credentials not configured');
    }

    console.log('🔄 Exchanging code for token with GitHub...');

    // Exchange code for token with GitHub
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

    console.log('📡 GitHub API response status:', tokenResponse.status);
    console.log(
      '📡 GitHub API response headers:',
      Object.fromEntries(tokenResponse.headers.entries()),
    );

    if (!tokenResponse.ok) {
      const errorData = (await tokenResponse.json()) as ErrorResponse;
      console.log('❌ GitHub API error:', errorData);
      throw new Error(
        `GitHub API error: ${errorData.error_description || errorData.error}`,
      );
    }

    const tokenData = (await tokenResponse.json()) as TokenResponse;
    console.log('✅ Token exchange successful:', {
      access_token: tokenData.access_token
        ? `${tokenData.access_token.substring(0, 10)}...`
        : 'null',
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });

    // Return the token response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(tokenData),
    };
  } catch (error) {
    console.error('💥 OAuth token exchange error:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.log('💥 Error message to return:', errorMessage);

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        error: 'token_exchange_failed',
        error_description: errorMessage,
      }),
    };
  }
};

export { handler };
