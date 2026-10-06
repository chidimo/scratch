import { describe, expect, it } from 'vitest';
import { buildNewGist, NEW_GIST_PLACEHOLDER } from './new-gist';

describe('buildNewGist', () => {
  it('builds a private markdown note named after the title', () => {
    expect(buildNewGist('Shopping list')).toEqual({
      description: 'Shopping list',
      files: { 'Shopping list.md': { content: NEW_GIST_PLACEHOLDER } },
      public: false,
    });
  });

  it('trims the title', () => {
    expect(buildNewGist('  padded  ')?.description).toBe('padded');
    expect(Object.keys(buildNewGist('  padded  ')?.files ?? {})).toEqual([
      'padded.md',
    ]);
  });

  it('returns null for an empty or whitespace-only title', () => {
    expect(buildNewGist('')).toBeNull();
    expect(buildNewGist('   ')).toBeNull();
  });

  it('replaces path separators, which GitHub does not allow in file names', () => {
    const gist = buildNewGist('a/b\\c');
    expect(Object.keys(gist?.files ?? {})).toEqual(['a-b-c.md']);
    expect(gist?.description).toBe('a/b\\c');
  });
});
