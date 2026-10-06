export type TokenExchangeConfig = {
  code: string;
  redirectUri: string;
  codeVerifier?: string | null;
  /**
   * Hosted exchange endpoint (the Netlify github-token function). When set,
   * the GitHub client secret stays on the server and never ships in the app.
   */
  exchangeUrl?: string;
  /** Only used by the legacy client-side exchange below. */
  clientId?: string;
  clientSecret?: string;
  githubEndpoint: string;
};

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

let warnedAboutLegacyExchange = false;

/** Exchanges an OAuth authorization code for an access token. */
export const exchangeCodeForToken = async (
  config: TokenExchangeConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<string> => {
  const viaServer = !!config.exchangeUrl;

  if (!viaServer && !warnedAboutLegacyExchange) {
    warnedAboutLegacyExchange = true;
    console.warn(
      'Exchanging the OAuth code on the device, which requires shipping the ' +
        'GitHub client secret in the app. Set EXPO_PUBLIC_AUTH_EXCHANGE_URL ' +
        'to use the server-side exchange instead.',
    );
  }

  const url = viaServer
    ? (config.exchangeUrl as string)
    : `${config.githubEndpoint}/login/oauth/access_token`;

  const body = viaServer
    ? {
        client: 'mobile',
        code: config.code,
        redirect_uri: config.redirectUri,
        ...(config.codeVerifier ? { code_verifier: config.codeVerifier } : {}),
      }
    : {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: config.code,
        redirect_uri: config.redirectUri,
        ...(config.codeVerifier ? { code_verifier: config.codeVerifier } : {}),
      };

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to exchange code for token: ${response.status} - ${errorText}`,
    );
  }

  const data = (await response.json()) as TokenResponse;
  if (!data.access_token) {
    throw new Error(
      data.error_description || data.error || 'Failed to get access token',
    );
  }

  return data.access_token;
};

/** Test hook: resets the one-time legacy warning. */
export const resetLegacyExchangeWarning = () => {
  warnedAboutLegacyExchange = false;
};
