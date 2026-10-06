import { useCreateGist } from '@scratch/shared';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserWithClient } from '../hooks/use-shared-hooks';
import { buildNewGist } from '../utils/new-gist';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const NewGistDialog = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const { githubClient } = useUserWithClient();
  const createGist = useCreateGist({ githubClient });
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle('');
      setError(null);
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !createGist.isPending) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, createGist.isPending]);

  if (!open) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const payload = buildNewGist(title);
    if (!payload) {
      setError('Please enter a title.');
      return;
    }

    setError(null);
    createGist.mutate(payload, {
      onSuccess: (gist) => {
        onClose();
        navigate(gist?.id ? `/gists/${gist.id}` : '/gists');
      },
      onError: (err) => {
        setError(
          err instanceof Error ? err.message : 'Failed to create the gist.',
        );
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/40 px-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !createGist.isPending) {
          onClose();
        }
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-gist-title"
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-brand-900/5"
      >
        <h2
          id="new-gist-title"
          className="mb-4 text-lg font-bold text-brand-900"
        >
          New gist
        </h2>
        <input
          ref={inputRef}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={createGist.isPending}
          maxLength={100}
          placeholder="Title"
          aria-label="Title"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        {error ? (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={createGist.isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createGist.isPending}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createGist.isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};
