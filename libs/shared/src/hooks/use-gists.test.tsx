import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '../../../../test-utils/render';
import type { GithubClientAdapter } from '../services/github-client';
import type { Gist } from '../types';
import { GISTS_QUERY_KEY, useDeleteGistById, useGists } from './use-gists';

const makeGist = (overrides: Partial<Gist> & { id: string }): Gist =>
  ({
    description: '',
    public: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    files: {},
    ...overrides,
  }) as Gist;

const file = (name: string, content = '') => ({
  filename: name,
  content,
  type: 'text/markdown',
  language: 'Markdown',
  raw_url: '',
  size: content.length,
});

const makeClient = (gists: Gist[] = []) => {
  const client = {
    getUserGists: vi.fn().mockResolvedValue(gists),
    updateGist: vi.fn().mockResolvedValue(undefined),
    deleteGist: vi.fn().mockResolvedValue(undefined),
  } as unknown as GithubClientAdapter;
  return client;
};

// react-query notifies observers on a timer, so flush it inside act().
const runMutation = (run: () => Promise<unknown>) =>
  act(async () => {
    await run();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const setup = <T,>(hook: () => T) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(hook, wrapper) };
};

describe('useGists', () => {
  it('keeps only gists that contain markdown files', async () => {
    const client = makeClient([
      makeGist({ id: 'md', files: { 'a.md': file('a.md', 'x') } }),
      makeGist({ id: 'txt', files: { 'a.txt': file('a.txt') } }),
    ]);
    const { result } = setup(() => useGists({ githubClient: client }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.map((n) => n.id)).toEqual(['md']);
  });

  it('maps a gist to a note, falling back to the file name for the title', async () => {
    const client = makeClient([
      makeGist({
        id: 'g',
        description: '',
        public: true,
        files: {
          'first.md': file('first.md', 'one'),
          'second.md': file('second.md', 'two'),
          'data.json': file('data.json'),
        },
      }),
    ]);
    const { result } = setup(() => useGists({ githubClient: client }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0]).toMatchObject({
      id: 'g',
      title: 'first',
      content: 'one',
      file_name: 'first.md',
      md_files: ['first.md', 'second.md'],
      md_file_count: 2,
      file_contents: { 'first.md': 'one', 'second.md': 'two' },
      is_public: true,
      sync_status: 'synced',
    });
  });

  it('prefers the description as the title', async () => {
    const client = makeClient([
      makeGist({
        id: 'g',
        description: 'My note',
        files: { 'a.md': file('a.md') },
      }),
    ]);
    const { result } = setup(() => useGists({ githubClient: client }));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.[0].title).toBe('My note');
  });

  it('filters by search term against description and file names, case-insensitively', async () => {
    const client = makeClient([
      makeGist({
        id: 'a',
        description: 'Grocery LIST',
        files: { 'x.md': file('x.md') },
      }),
      makeGist({ id: 'b', files: { 'Recipes.md': file('Recipes.md') } }),
      makeGist({ id: 'c', files: { 'other.md': file('other.md') } }),
    ]);

    const byDescription = setup(() =>
      useGists({ githubClient: client, searchTerm: 'grocery' }),
    );
    await waitFor(() =>
      expect(byDescription.result.current.isSuccess).toBe(true),
    );
    expect(byDescription.result.current.data?.map((n) => n.id)).toEqual(['a']);

    const byFile = setup(() =>
      useGists({ githubClient: client, searchTerm: 'recipes' }),
    );
    await waitFor(() => expect(byFile.result.current.isSuccess).toBe(true));
    expect(byFile.result.current.data?.map((n) => n.id)).toEqual(['b']);
  });

  it('does not fetch when disabled', async () => {
    const client = makeClient();
    setup(() => useGists({ githubClient: client, enabled: false }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(client.getUserGists).not.toHaveBeenCalled();
  });
});

describe('useDeleteGistById', () => {
  it('deletes the whole gist when it has a single markdown file', async () => {
    const client = makeClient();
    const { result } = setup(() => useDeleteGistById({ githubClient: client }));

    await runMutation(() =>
      result.current.mutateAsync({
        id: 'g1',
        fileName: 'a.md',
        mdFileCount: 1,
      }),
    );

    expect(client.deleteGist).toHaveBeenCalledWith('g1');
    expect(client.updateGist).not.toHaveBeenCalled();
  });

  it('only removes the active file when the gist has several markdown files', async () => {
    const client = makeClient();
    const { result } = setup(() => useDeleteGistById({ githubClient: client }));

    await runMutation(() =>
      result.current.mutateAsync({
        id: 'g1',
        fileName: 'b.md',
        mdFileCount: 3,
      }),
    );

    expect(client.updateGist).toHaveBeenCalledWith('g1', undefined, {
      'b.md': null,
    });
    expect(client.deleteGist).not.toHaveBeenCalled();
  });

  it('deletes the whole gist when no file name is given', async () => {
    const client = makeClient();
    const { result } = setup(() => useDeleteGistById({ githubClient: client }));

    await runMutation(() =>
      result.current.mutateAsync({ id: 'g1', mdFileCount: 3 }),
    );

    expect(client.deleteGist).toHaveBeenCalledWith('g1');
  });

  it('invalidates the gists query after deleting', async () => {
    const client = makeClient();
    const { result, queryClient } = setup(() =>
      useDeleteGistById({ githubClient: client }),
    );
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await runMutation(() => result.current.mutateAsync({ id: 'g1' }));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: [GISTS_QUERY_KEY] });
  });
});
