import {
  Note,
  useDeleteGistById,
  useGistById,
  useUpdateGistFileContent,
} from '@scratch/shared';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { RichTextEditor } from '../components/rich-text-editor';
import { useAuth } from '../context/auth-context';
import { GistVisibility } from '../components/gist-visibility';
import { KnownUserHeader } from '../components/known-user-header';
import { PageMetaTitle } from '../components/page-meta-title';
import { useUserWithClient } from '../hooks/use-shared-hooks';

const LoadingState = () => (
  <>
    <PageMetaTitle title="Loading gist" />
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-brand-900">
          Loading gist...
        </h2>
      </div>
    </div>
  </>
);

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

const ErrorState = ({ message, onRetry }: ErrorStateProps) => (
  <>
    <PageMetaTitle title="Error" />
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-brand-900 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            Back to gists
          </Link>
        </div>
      </div>
    </div>
  </>
);

const NotFoundState = () => (
  <>
    <PageMetaTitle title="Gist not found" />
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-brand-900/5 p-10 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-brand-900 mb-3">
          Gist not found
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find that gist in your list.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-brand-500 hover:bg-brand-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Back to gists
        </Link>
      </div>
    </div>
  </>
);

type GistDetailStateParams = {
  note: Note | null | undefined;
  isNoteLoading: boolean;
  noteError: unknown;
  refetchNote: () => Promise<unknown>;
};

const getGistDetailState = ({
  note,
  isNoteLoading,
  noteError,
  refetchNote,
}: GistDetailStateParams) => {
  if (isNoteLoading && !note) {
    return <LoadingState />;
  }

  if (noteError) {
    const message =
      noteError instanceof Error ? noteError.message : 'Failed to load gist';
    return <ErrorState message={message} onRetry={() => void refetchNote()} />;
  }

  if (!note) {
    return <NotFoundState />;
  }

  return null;
};

type SaveParams = {
  gistId: string | undefined;
  activeFile: string | null;
  activeContent: string;
  isPublic: boolean | undefined;
  isSaving: boolean;
  updateGistFileContent: {
    mutateAsync: (params: {
      id: string;
      fileName: string;
      content: string;
      isPublic?: boolean;
    }) => Promise<unknown>;
  };
  onSaved: (fileName: string, content: string) => void;
};

const useGistFileSave = ({
  gistId,
  activeFile,
  activeContent,
  isPublic,
  isSaving,
  updateGistFileContent,
  onSaved,
}: SaveParams) => {
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!gistId || !activeFile || isSaving) {
      return;
    }
    setSaveError(null);
    try {
      await updateGistFileContent.mutateAsync({
        id: gistId,
        fileName: activeFile,
        content: activeContent,
        isPublic,
      });
      onSaved(activeFile, activeContent);
      window.alert('Saved.');
    } catch (error_) {
      setSaveError(
        error_ instanceof Error ? error_.message : 'Failed to save file.',
      );
    }
  };

  return { saveError, setSaveError, handleSave };
};

export const GistDetail = () => {
  const { gistId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { githubClient } = useUserWithClient();

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loadedGistId, setLoadedGistId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [initialContents, setInitialContents] = useState<
    Record<string, string>
  >({});
  const [isPreviewing, setIsPreviewing] = useState(false);

  const {
    data: note,
    isLoading: isNoteLoading,
    error: noteError,
    refetch: refetchNote,
  } = useGistById(gistId ?? null, {
    githubClient,
    enabled: !!token,
  });
  const updateGistFileContent = useUpdateGistFileContent({ githubClient });
  const deleteGist = useDeleteGistById({ githubClient });

  useEffect(() => {
    if (!note || !gistId) {
      return;
    }
    if (loadedGistId !== gistId) {
      setLoadedGistId(gistId);
      setFileContents(note.file_contents ?? {});
      setInitialContents(note.file_contents ?? {});
      setActiveFile(note.md_files?.[0] ?? null);
      setSaveError(null);
      setIsPreviewing(false);
    }
  }, [note, gistId, loadedGistId]);

  const markdownFiles = note?.md_files ?? [];
  const activeContent = activeFile ? (fileContents[activeFile] ?? '') : '';
  const isDirty =
    !!activeFile && activeContent !== (initialContents[activeFile] ?? '');
  const { saveError, setSaveError, handleSave } = useGistFileSave({
      gistId,
      activeFile,
      activeContent,
      isPublic: note?.is_public,
      isSaving: updateGistFileContent.isPending,
      updateGistFileContent,
      onSaved: (fileName, content) => {
        setInitialContents((prev) => ({ ...prev, [fileName]: content }));
      },
    });

  const isDeletingWholeGist = markdownFiles.length <= 1;

  const handleDelete = () => {
    if (!gistId || !activeFile || deleteGist.isPending) {
      return;
    }

    const confirmed = window.confirm(
      isDeletingWholeGist
        ? 'Delete this gist? This action cannot be undone.'
        : `Delete "${activeFile}"? This action cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    deleteGist.mutate(
      {
        id: gistId,
        fileName: activeFile,
        mdFileCount: note?.md_file_count,
      },
      {
        onSuccess: () => {
          navigate('/gists');
        },
        onError: () => {
          window.alert('Failed to delete. Please try again.');
        },
      },
    );
  };

  const stateView = getGistDetailState({
    note,
    isNoteLoading,
    noteError,
    refetchNote,
  });

  if (stateView) {
    return stateView;
  }

  if (!note) {
    return null;
  }

  const activeGist = note;

  return (
    <>
      <PageMetaTitle
        title={activeGist.title || 'Untitled Gist'}
        description={`Details for ${activeGist.title || 'a gist'} from ${activeGist.owner_login || 'GitHub user'}`}
      />
      <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
        <KnownUserHeader />

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-brand-900/5 p-5 mb-4">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-brand-900 truncate">
                  {activeGist.title || 'Untitled Gist'}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Created{' '}
                  {new Date(activeGist.created_at).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' },
                  )}{' '}
                  · Updated{' '}
                  {new Date(activeGist.updated_at).toLocaleDateString(
                    'en-US',
                    { month: 'short', day: 'numeric', year: 'numeric' },
                  )}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <GistVisibility isPublic={activeGist.is_public ?? false} />
                {activeGist.html_url ? (
                  <a
                    href={activeGist.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium whitespace-nowrap"
                  >
                    View on GitHub
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-brand-900/5 p-5">
            {markdownFiles.length === 0 ? (
              <p className="text-sm text-gray-600">
                This gist does not contain any markdown files.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  <div className="flex flex-wrap gap-2">
                    {markdownFiles.map((file: string, index: number) => (
                      <button
                        key={file}
                        onClick={() => {
                          setActiveFile(file);
                          setSaveError(null);
                          setIsPreviewing(false);
                        }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          activeFile === file
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300'
                        }`}
                      >
                        File: {index + 1}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleDelete}
                      disabled={deleteGist.isPending}
                      className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteGist.isPending
                        ? 'Deleting...'
                        : isDeletingWholeGist
                          ? 'Delete gist'
                          : 'Delete file'}
                    </button>
                    <button
                      onClick={() => setIsPreviewing((prev) => !prev)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isPreviewing ? 'Edit' : 'Preview'}
                    </button>
                    <button
                      onClick={() => {
                        void handleSave();
                      }}
                      disabled={
                        !isDirty ||
                        updateGistFileContent.isPending ||
                        !activeFile
                      }
                      className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateGistFileContent.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {saveError ? (
                  <p className="text-sm text-red-600 mb-3">{saveError}</p>
                ) : null}

                <RichTextEditor
                  value={activeContent}
                  onChange={(nextValue) => {
                    if (!activeFile) return;
                    setFileContents((prev) => ({
                      ...prev,
                      [activeFile]: nextValue,
                    }));
                  }}
                  placeholder="Start writing..."
                  isPreviewing={isPreviewing}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
