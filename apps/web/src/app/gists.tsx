import { useMemo } from 'react';
import { Note, useGists } from '@scratch/shared';
import { useAuth } from '../context/auth-context';
import { getGithubClient } from '../services/github-client';
import { GistListItem } from '../components/gist-list-item';
import { UnknownUser } from '../components/unknown-user';
import { KnownUserHeader } from '../components/known-user-header';
import { PageMetaTitle } from '../components/page-meta-title';

export const Gists = () => {
  const { user, token } = useAuth();
  const githubClient = useMemo(() => getGithubClient(), []);
  const {
    data: gists = [],
    isLoading,
    error,
    refetch,
  } = useGists({
    githubClient,
    enabled: !!token,
  });

  // Show login page if user is not authenticated
  if (!user) {
    return <UnknownUser title="Scratch (Gists)" />;
  }

  if (isLoading && gists.length === 0) {
    return (
      <>
        <PageMetaTitle title="Loading" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Loading your gists...
            </h2>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMetaTitle title="Error" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">
              {error instanceof Error ? error.message : 'Failed to load gists'}
            </p>
            <button
              onClick={() => {
                void refetch();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMetaTitle
        title={`${user?.name || user?.login}'s Gists`}
        description={`Manage and view ${user?.public_gists} gists from ${user?.name || user?.login} on Scratch (Gists)`}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <KnownUserHeader />

        <main className="max-w-6xl mx-auto px-6 py-8">
          {gists.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No gists found
              </h2>
              <p className="text-gray-600 mb-6">
                You haven't created any public gists yet.
              </p>
              <a
                href="https://gist.github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Gist
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {gists.map((gist: Note) => (
                <GistListItem key={gist.id} gist={gist} />
              ))}
            </div>
          )}

          {isLoading && gists.length > 0 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Refreshing...</span>
            </div>
          )}
        </main>
      </div>
    </>
  );
};
