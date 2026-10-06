import { describe, expect, it } from 'vitest';
import { ACCENT_CLASSES, accentClassForId } from './accent';
import { mergeClasses } from './class-merge';

describe('mergeClasses', () => {
  it('joins truthy class names and drops falsy values', () => {
    expect(mergeClasses('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(mergeClasses(false, null)).toBe('');
  });
});

describe('accentClassForId', () => {
  it('is deterministic for the same id', () => {
    expect(accentClassForId('abc123')).toBe(accentClassForId('abc123'));
  });

  it('always returns one of the accent classes', () => {
    for (const id of ['', 'a', 'b6b72dfe136ea03ad0ecad88f2d8972a', 'zzzz']) {
      expect(ACCENT_CLASSES).toContain(accentClassForId(id));
    }
  });

  it('spreads different ids across more than one accent', () => {
    const ids = Array.from({ length: 40 }, (_, i) => `gist-${i}-${i * 7}`);
    const used = new Set(ids.map(accentClassForId));
    expect(used.size).toBeGreaterThan(1);
  });
});
