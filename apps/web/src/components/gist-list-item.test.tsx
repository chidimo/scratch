import type { Note } from '@scratch/shared';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from '../../../../test-utils/render';
import { accentClassForId } from '../utils/accent';
import { GistListItem } from './gist-list-item';

const makeNote = (overrides: Partial<Note> = {}): Note =>
  ({
    id: 'gist-1',
    title: 'My note',
    content: '',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-03-04T00:00:00Z',
    tags: [],
    md_files: ['a.md'],
    is_public: false,
    sync_status: 'synced',
    ...overrides,
  }) as Note;

let cleanup: (() => void) | undefined;

const renderItem = (gist: Note) => {
  const view = render(
    <MemoryRouter>
      <GistListItem gist={gist} />
    </MemoryRouter>,
  );
  cleanup = view.unmount;
  return view.container;
};

afterEach(() => cleanup?.());

describe('GistListItem', () => {
  it('shows the title and links to the gist detail page', () => {
    const container = renderItem(makeNote());

    expect(container.textContent).toContain('My note');
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toEqual(['/gists/gist-1', '/gists/gist-1']);
  });

  it('falls back to "Untitled Gist" when there is no title', () => {
    const container = renderItem(makeNote({ title: '' }));
    expect(container.textContent).toContain('Untitled Gist');
  });

  it('lists up to three files and summarises the rest', () => {
    const container = renderItem(
      makeNote({ md_files: ['1.md', '2.md', '3.md', '4.md', '5.md'] }),
    );

    expect(container.textContent).toContain('3.md');
    expect(container.textContent).not.toContain('4.md');
    expect(container.textContent).toContain('+2 more files');
  });

  it('uses the singular for exactly one hidden file', () => {
    const container = renderItem(
      makeNote({ md_files: ['1.md', '2.md', '3.md', '4.md'] }),
    );
    expect(container.textContent).toContain('+1 more file');
    expect(container.textContent).not.toContain('+1 more files');
  });

  it('shows no summary when everything fits', () => {
    const container = renderItem(makeNote({ md_files: ['1.md', '2.md'] }));
    expect(container.textContent).not.toContain('more file');
  });

  it('colours the top stripe from the gist id', () => {
    const container = renderItem(makeNote({ id: 'stable-id' }));
    const stripe = container.querySelector('span.h-1\\.5');
    expect(stripe?.className).toContain(accentClassForId('stable-id'));
  });
});
