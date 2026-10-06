import type { HandlerEvent } from '@netlify/functions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from './github-token';

const call = (event: Partial<HandlerEvent>) =>
  handler({ headers: {}, ...event } as HandlerEvent, {} as never) as Promise<{
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }>;

const post = (body: unknown) =>
  call({ httpMethod: 'POST', body: JSON.stringify(body) });

describe('github-token handler', () => {
  beforeEach(() => {
    // The handler is very chatty; keep test output readable.
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubEnv('GITHUB_CLIENT_ID', 'client-id');
    vi.stubEnv('GITHUB_CLIENT_SECRET', 'client-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('answers CORS preflight', async () => {
    const res = await call({ httpMethod: 'OPTIONS' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Access-Control-Allow-Methods']).toContain('POST');
  });

  it('rejects non-POST methods', async () => {
    const res = await call({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
  });

  it.each([
    ['a missing body', undefined, 'Request body is required'],
    ['a missing code', { redirect_uri: 'x' }, 'Authorization code is required'],
    ['a missing redirect_uri', { code: 'c' }, 'Redirect URI is required'],
  ])('returns 400 for %s', async (_label, body, message) => {
    const res = await call({
      httpMethod: 'POST',
      body: body === undefined ? null : JSON.stringify(body),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error_description).toBe(message);
  });

  it('returns 400 when OAuth credentials are not configured', async () => {
    vi.stubEnv('GITHUB_CLIENT_SECRET', '');
    const res = await post({ code: 'c', redirect_uri: 'r' });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error_description).toBe(
      'GitHub OAuth credentials not configured',
    );
  });

  it('exchanges the code with GitHub and returns the token payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'tok',
          token_type: 'bearer',
          scope: 'gist',
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const res = await post({
      code: 'the-code',
      redirect_uri: 'https://app/callback',
      code_verifier: 'verifier',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).access_token).toBe('tok');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://github.com/login/oauth/access_token');
    const sent = init.body as URLSearchParams;
    expect(sent.get('client_id')).toBe('client-id');
    expect(sent.get('client_secret')).toBe('client-secret');
    expect(sent.get('code')).toBe('the-code');
    expect(sent.get('code_verifier')).toBe('verifier');
  });

  it('omits code_verifier when none is supplied', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await post({ code: 'c', redirect_uri: 'r' });

    const sent = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(sent.has('code_verifier')).toBe(false);
  });

  it('surfaces a GitHub error response as a 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: 'bad_verification_code',
            error_description: 'The code passed is incorrect or expired.',
          }),
          { status: 400 },
        ),
      ),
    );

    const res = await post({ code: 'c', redirect_uri: 'r' });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error_description).toContain(
      'The code passed is incorrect or expired.',
    );
  });
});
