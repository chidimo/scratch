import { beforeEach, describe, expect, it, vi } from 'vitest';

const octokit = vi.hoisted(() => ({
  instances: [] as unknown[],
  gists: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
  rateLimit: { get: vi.fn() },
  users: { getAuthenticated: vi.fn() },
}));

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(function (this: unknown, opts: unknown) {
    octokit.instances.push(opts);
    return {
      rest: {
        gists: octokit.gists,
        rateLimit: octokit.rateLimit,
        users: octokit.users,
      },
    };
  }),
}));

import { createGithubClient } from './github-client';

const gistResponse = {
  id: 'g1',
  files: {
    'a.md': { filename: 'a.md', content: 'hi', raw_url: 'u', size: 2 },
  },
};

describe('createGithubClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    octokit.instances.length = 0;
  });

  it('throws when there is no token', async () => {
    const client = createGithubClient({ getToken: () => null });
    await expect(client.getUserGists()).rejects.toThrow(
      'GitHub client not initialized',
    );
  });

  it('throws when the connectivity check fails', async () => {
    const client = createGithubClient({
      getToken: () => 't',
      checkConnectivity: async () => false,
    });
    await expect(client.getUserGists()).rejects.toThrow(
      'No internet connection',
    );
  });

  it('reuses the Octokit instance for the same token and rebuilds on change', async () => {
    octokit.gists.list.mockResolvedValue({ data: [] });
    let token = 'one';
    const client = createGithubClient({ getToken: () => token });

    await client.getUserGists();
    await client.getUserGists();
    expect(octokit.instances).toHaveLength(1);

    token = 'two';
    await client.getUserGists();
    expect(octokit.instances).toHaveLength(2);
  });

  it('defaults new gists to private and wraps file content', async () => {
    octokit.gists.create.mockResolvedValue({ data: gistResponse });
    const client = createGithubClient({ getToken: () => 't' });

    await client.createGist('desc', { 'a.md': 'hi' });

    expect(octokit.gists.create).toHaveBeenCalledWith({
      description: 'desc',
      public: false,
      files: { 'a.md': { content: 'hi' } },
    });
  });

  it('only sends description/public on update when provided', async () => {
    octokit.gists.update.mockResolvedValue({ data: gistResponse });
    const client = createGithubClient({ getToken: () => 't' });

    await client.updateGist('g1', undefined, { 'a.md': 'new' });
    expect(octokit.gists.update).toHaveBeenLastCalledWith({
      gist_id: 'g1',
      files: { 'a.md': { content: 'new' } },
    });

    await client.updateGist('g1', 'title', { 'a.md': 'new' }, true);
    expect(octokit.gists.update).toHaveBeenLastCalledWith({
      gist_id: 'g1',
      description: 'title',
      public: true,
      files: { 'a.md': { content: 'new' } },
    });
  });

  it('sends null for a file to remove it from the gist', async () => {
    octokit.gists.update.mockResolvedValue({ data: gistResponse });
    const client = createGithubClient({ getToken: () => 't' });

    await client.updateGist('g1', undefined, { 'old.md': null });

    expect(octokit.gists.update).toHaveBeenCalledWith({
      gist_id: 'g1',
      files: { 'old.md': null },
    });
  });

  it('normalises missing file fields on getGist', async () => {
    octokit.gists.get.mockResolvedValue({
      data: { id: 'g1', files: { 'a.md': { filename: 'a.md' } } },
    });
    const client = createGithubClient({ getToken: () => 't' });

    const gist = await client.getGist('g1');

    expect(gist.files['a.md']).toMatchObject({
      filename: 'a.md',
      content: '',
      type: '',
      language: null,
      size: 0,
    });
  });

  it('blocks further calls once the rate limit is exhausted', async () => {
    vi.useFakeTimers();
    try {
      const reset = Math.floor(Date.now() / 1000) + 60;
      octokit.rateLimit.get.mockResolvedValue({
        data: { resources: { core: { remaining: 0, reset, limit: 5000 } } },
      });
      const client = createGithubClient({ getToken: () => 't' });

      await client.getRateLimitStatus();

      await expect(client.getUserGists()).rejects.toThrow('Rate limited');
    } finally {
      vi.useRealTimers();
    }
  });
});
