import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { click, render, setInputValue } from '../../../../test-utils/render';

const mutate = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ isPending: false }));

vi.mock('@scratch/shared', () => ({
  useCreateGist: () => ({ mutate, isPending: state.isPending }),
}));
vi.mock('../hooks/use-shared-hooks', () => ({
  useUserWithClient: () => ({ githubClient: {} }),
}));

import { NewGistDialog } from './new-gist-dialog';

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

let cleanup: (() => void) | undefined;

const renderDialog = (props: { open?: boolean; onClose?: () => void } = {}) => {
  const onClose = props.onClose ?? vi.fn();
  const view = render(
    <MemoryRouter initialEntries={['/gists']}>
      <Routes>
        <Route
          path="*"
          element={
            <>
              <NewGistDialog open={props.open ?? true} onClose={onClose} />
              <Where />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  cleanup = view.unmount;
  const q = <T extends Element>(selector: string) =>
    view.container.querySelector(selector) as T;
  return { ...view, onClose, q };
};

const submit = (form: HTMLFormElement) =>
  act(() => {
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
  });

describe('NewGistDialog', () => {
  beforeEach(() => {
    mutate.mockReset();
    state.isPending = false;
  });
  afterEach(() => cleanup?.());

  it('renders nothing when closed', () => {
    const { container } = renderDialog({ open: false });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('shows a validation error and does not create for an empty title', () => {
    const { q } = renderDialog();

    submit(q<HTMLFormElement>('form'));

    expect(q('[role="alert"]').textContent).toBe('Please enter a title.');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('creates a private note from the title and opens it', () => {
    mutate.mockImplementation((_payload, options) =>
      options.onSuccess({ id: 'new-id' }),
    );
    const { q, onClose } = renderDialog();

    setInputValue(q<HTMLInputElement>('input'), 'Ideas');
    submit(q<HTMLFormElement>('form'));

    expect(mutate.mock.calls[0][0]).toEqual({
      description: 'Ideas',
      files: { 'Ideas.md': { content: '# New note' } },
      public: false,
    });
    expect(onClose).toHaveBeenCalled();
    expect(q('[data-testid="where"]').textContent).toBe('/gists/new-id');
  });

  it('shows the error when creation fails and stays on the page', () => {
    mutate.mockImplementation((_payload, options) =>
      options.onError(new Error('boom')),
    );
    const { q, onClose } = renderDialog();

    setInputValue(q<HTMLInputElement>('input'), 'Ideas');
    submit(q<HTMLFormElement>('form'));

    expect(q('[role="alert"]').textContent).toBe('boom');
    expect(onClose).not.toHaveBeenCalled();
    expect(q('[data-testid="where"]').textContent).toBe('/gists');
  });

  it('closes on Cancel and on Escape', () => {
    const { q, onClose } = renderDialog();
    const cancel = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent === 'Cancel',
    ) as HTMLButtonElement;

    click(cancel);
    expect(onClose).toHaveBeenCalledTimes(1);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(q('[role="dialog"]')).not.toBeNull();
  });

  it('disables the form and ignores Escape while creating', () => {
    state.isPending = true;
    const { q, onClose } = renderDialog();

    expect(q<HTMLInputElement>('input').disabled).toBe(true);
    expect(q<HTMLButtonElement>('button[type="submit"]').textContent).toBe(
      'Creating...',
    );

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
