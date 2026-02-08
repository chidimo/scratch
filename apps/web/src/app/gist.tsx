import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useGistById, useUpdateGistFileContent } from '@scratch/shared';
import { useAuth } from '../context/AuthContext';
import { getGithubClient } from '../services/GithubClient';
import { RichTextEditor } from '../components/rich-text-editor';

type SignInStateProps = {
  login: () => void;
};

const SignInState = ({ login }: SignInStateProps) => (
  <>
    <Helmet>
      <title>Sign in - Scratch (Gists)</title>
      <meta
        name="description"
        content="Sign in with GitHub to view your gist details"
      />
    </Helmet>
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <img
          src="/scratch-icon.png"
          alt="Scratch (Gists) logo"
          className="w-12 h-12 rounded-xl mx-auto mb-6"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Sign in to view this gist
        </h2>
        <p className="text-gray-600 mb-6">
          Connect your GitHub account to access gist details.
        </p>
        <button
          onClick={login}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Sign in with GitHub
        </button>
        <div className="mt-6">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
            Back to gists
          </Link>
        </div>
      </div>
    </div>
  </>
);

const LoadingState = () => (
  <>
    <Helmet>
      <title>Loading gist - Scratch (Gists)</title>
    </Helmet>
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
    <Helmet>
      <title>Error - Scratch (Gists)</title>
    </Helmet>
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
    <Helmet>
      <title>Gist not found - Scratch (Gists)</title>
    </Helmet>
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
  isLoading: boolean;
  gistsCount: number;
  note: unknown;
  isNoteLoading: boolean;
  error: string | null;
  noteError: unknown;
  fetchGists: () => Promise<void>;
  login: () => void;
  gist: unknown;
};

const getGistDetailState = ({
  user,
  isLoading,
  gistsCount,
  note,
  isNoteLoading,
  error,
  noteError,
  fetchGists,
  login,
  gist,
}: GistDetailStateParams) => {
  if (!user) {
    return <SignInState login={login} />;
  }

  if ((isLoading && gistsCount === 0) || (isNoteLoading && !note)) {
    return <LoadingState />;
  }

  if (error || noteError) {
    const message =
      error ||
      (noteError instanceof Error ? noteError.message : 'Failed to load gist');
    return <ErrorState message={message} onRetry={() => void fetchGists()} />;
  }

  if (!gist) {
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
  const { user, token, gists, isLoading, error, fetchGists, login } = useAuth();
  const githubClient = useMemo(() => getGithubClient(), []);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [initialContents, setInitialContents] = useState<
    Record<string, string>
  >({});
  const [loadedGistId, setLoadedGistId] = useState<string | null>(null);

  const {
    data: note,
    isLoading: isNoteLoading,
    error: noteError,
  } = useGistById(gistId ?? null, {
    githubClient,
    enabled: !!token,
  });
  const updateGistFileContent = useUpdateGistFileContent({ githubClient });

  useEffect(() => {
    if (user && gists.length === 0 && !isLoading) {
      fetchGists();
    }
  }, [user, gists.length, isLoading, fetchGists]);

  const gist = useMemo(
    () => gists.find((item) => item.id === gistId),
    [gists, gistId],
  );

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
      isPublic: gist?.public,
      isSaving: updateGistFileContent.isPending,
      updateGistFileContent,
      onSaved: (fileName, content) => {
        setInitialContents((prev) => ({ ...prev, [fileName]: content }));
      },
    });

  const stateView = getGistDetailState({
    user,
    isLoading,
    gistsCount: gists.length,
    note,
    isNoteLoading,
    error,
    noteError,
    fetchGists,
    login,
    gist,
  });

  if (stateView) {
    return stateView;
  }

  return (
    <>
      <Helmet>
        <title>{gist.description || 'Untitled Gist'} - Scratch (Gists)</title>
        <meta
          name="description"
          content={`Details for ${gist.description || 'a gist'} from ${gist.owner.login}`}
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to gists
                </Link>
              </div>
              <a
                href={gist.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                View on GitHub
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {gist.description || 'Untitled Gist'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    Created {new Date(gist.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Updated {new Date(gist.updated_at).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    gist.public
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {gist.public ? '🌐 Public' : '🔒 Private'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={gist.owner.avatar_url}
                  alt={`${gist.owner.login} avatar`}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">
                  {gist.owner.login}
                </span>
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
                  {markdownFiles.map((file) => (
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
                      {file}
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
        </main>
      </div>
    </>
  );
};
