import { Note, useGistById, useUpdateGistFileContent } from '@scratch/shared';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { RichTextEditor } from '../components/rich-text-editor';
import { useAuth } from '../context/auth-context';
import { getGithubClient } from '../services/github-client';
import { UnknownUser } from '../components/unknown-user';
import { GistVisibility } from '../components/gist-visibility';
import { KnownUserHeader } from '../components/known-user-header';
import { PageMetaTitle } from '../components/page-meta-title';

const LoadingState = () => (
  <>
    <PageMetaTitle title="Loading gist" />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Gist not found
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't find that gist in your list.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Back to gists
        </Link>
      </div>
    </div>
  </>
);

type GistDetailStateParams = {
  user: { login: string } | null;
  note: Note | null | undefined;
  isNoteLoading: boolean;
  noteError: unknown;
  refetchNote: () => Promise<unknown>;
};

const getGistDetailState = ({
  user,
  note,
  isNoteLoading,
  noteError,
  refetchNote,
}: GistDetailStateParams) => {
  if (!user) {
    return <UnknownUser title="Sign in to view this gist" />;
  }

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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!gistId || !activeFile || isSaving) {
      return;
    }
    setSaveError(null);
    setSaveMessage(null);
    try {
      await updateGistFileContent.mutateAsync({
        id: gistId,
        fileName: activeFile,
        content: activeContent,
        isPublic,
      });
      onSaved(activeFile, activeContent);
      setSaveMessage('Saved.');
    } catch (error_) {
      setSaveError(
        error_ instanceof Error ? error_.message : 'Failed to save file.',
      );
    }
  };

  return { saveError, saveMessage, setSaveError, setSaveMessage, handleSave };
};

export const GistDetail = () => {
  const { gistId } = useParams();
  const { user, token } = useAuth();
  const githubClient = useMemo(() => getGithubClient(), []);

  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [loadedGistId, setLoadedGistId] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [initialContents, setInitialContents] = useState<
    Record<string, string>
  >({});

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
      setSaveMessage(null);
    }
  }, [note, gistId, loadedGistId]);

  const markdownFiles = note?.md_files ?? [];
  const activeContent = activeFile ? (fileContents[activeFile] ?? '') : '';
  const isDirty =
    !!activeFile && activeContent !== (initialContents[activeFile] ?? '');
  const { saveError, saveMessage, setSaveError, setSaveMessage, handleSave } =
    useGistFileSave({
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

  const stateView = getGistDetailState({
    user,
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <KnownUserHeader />

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 mb-2">
                    {activeGist.title || 'Untitled Gist'}
                  </h1>
                  <p className="text-xs text-gray-600">
                    Created{' '}
                    {new Date(activeGist.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-600">
                    Updated{' '}
                    {new Date(activeGist.updated_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col justify-between gap-2">
                  <GistVisibility isPublic={activeGist.is_public ?? false} />
                  {activeGist.html_url ? (
                    <p>
                      <a
                        href={activeGist.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      >
                        View on GitHub
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Markdown Files ({markdownFiles.length})
              </h2>
              <button
                onClick={() => {
                  void handleSave();
                }}
                disabled={
                  !isDirty || updateGistFileContent.isPending || !activeFile
                }
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateGistFileContent.isPending ? 'Saving...' : 'Save file'}
              </button>
            </div>

            {saveMessage ? (
              <p className="text-sm text-green-600 mb-3">{saveMessage}</p>
            ) : null}
            {saveError ? (
              <p className="text-sm text-red-600 mb-3">{saveError}</p>
            ) : null}

            {markdownFiles.length === 0 ? (
              <p className="text-sm text-gray-600">
                This gist does not contain any markdown files.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4 mb-4">
                  {markdownFiles.map((file: string, index: number) => (
                    <button
                      key={file}
                      onClick={() => {
                        setActiveFile(file);
                        setSaveMessage(null);
                        setSaveError(null);
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        activeFile === file
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      File: {index + 1}
                    </button>
                  ))}
                </div>
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
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
