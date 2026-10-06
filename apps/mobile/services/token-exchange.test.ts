import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  exchangeCodeForToken,
  resetLegacyExchangeWarning,
  type TokenExchangeConfig,
} from './token-exchange';

const base: TokenExchangeConfig = {
  code: 'the-code',
  redirectUri: 'scratch://auth/callback',
  codeVerifier: 'verifier',
  githubEndpoint: 'https://github.com',
};

const ok = (body: unknown) =>
  vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

const sentBody = (fetchMock: ReturnType<typeof vi.fn>) =>
  JSON.parse(fetchMock.mock.calls[0][1].body as string);

describe('exchangeCodeForToken', () => {
  beforeEach(() => {
    resetLegacyExchangeWarning();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('via the hosted exchange endpoint', () => {
    const config = { ...base, exchangeUrl: 'https://example.com/exchange' };

    it('posts the code to the endpoint without any client credentials', async () => {
      const fetchMock = ok({ access_token: 'tok' });

      const token = await exchangeCodeForToken(
        { ...config, clientId: 'id', clientSecret: 'shh' },
        fetchMock,
      );

      expect(token).toBe('tok');
      expect(fetchMock.mock.calls[0][0]).toBe('https://example.com/exchange');
      expect(sentBody(fetchMock)).toEqual({
        client: 'mobile',
        code: 'the-code',
        redirect_uri: 'scratch://auth/callback',
        code_verifier: 'verifier',
      });
      expect(JSON.stringify(sentBody(fetchMock))).not.toContain('shh');
    });

    it('omits the verifier when there is none', async () => {
      const fetchMock = ok({ access_token: 'tok' });
      await exchangeCodeForToken({ ...config, codeVerifier: null }, fetchMock);
      expect(sentBody(fetchMock)).not.toHaveProperty('code_verifier');
    });

    it('does not warn about the legacy exchange', async () => {
      await exchangeCodeForToken(config, ok({ access_token: 'tok' }));
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('legacy on-device exchange', () => {
    const config = { ...base, clientId: 'id', clientSecret: 'shh' };

    it('posts to GitHub with the client credentials', async () => {
      const fetchMock = ok({ access_token: 'tok' });

      await exchangeCodeForToken(config, fetchMock);

      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://github.com/login/oauth/access_token',
      );
      expect(sentBody(fetchMock)).toMatchObject({
        client_id: 'id',
        client_secret: 'shh',
        code: 'the-code',
        code_verifier: 'verifier',
      });
    });

    it('warns once that the secret is shipped in the app', async () => {
      await exchangeCodeForToken(config, ok({ access_token: 'a' }));
      await exchangeCodeForToken(config, ok({ access_token: 'b' }));

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(vi.mocked(console.warn).mock.calls[0][0]).toContain(
        'EXPO_PUBLIC_AUTH_EXCHANGE_URL',
      );
    });
  });

  it('throws with the status and body on an HTTP error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('nope', { status: 502 }));

    await expect(
      exchangeCodeForToken({ ...base, exchangeUrl: 'https://x' }, fetchMock),
    ).rejects.toThrow('Failed to exchange code for token: 502 - nope');
  });

  it("surfaces GitHub's error_description when no token comes back", async () => {
    const fetchMock = ok({
      error: 'bad_verification_code',
      error_description: 'The code passed is incorrect or expired.',
    });

    await expect(
      exchangeCodeForToken(
        { ...base, clientId: 'i', clientSecret: 's' },
        fetchMock,
      ),
    ).rejects.toThrow('The code passed is incorrect or expired.');
  });

  it('falls back to a generic message when the response has no detail', async () => {
    await expect(
      exchangeCodeForToken({ ...base, exchangeUrl: 'https://x' }, ok({})),
    ).rejects.toThrow('Failed to get access token');
  });
});
