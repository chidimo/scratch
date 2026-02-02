import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';

export const Gists = () => {
  const { user, gists, isLoading, error, fetchGists, logout, login } =
    useAuth();

  useEffect(() => {
    if (user && gists.length === 0) {
      fetchGists();
    }
  }, [user, gists.length, fetchGists]);

  // Show login page if user is not authenticated
  if (!user) {
    return (
      <>
        <Helmet>
          <title>Scratch (Gists) - Your Cross-Platform Scratchpad</title>
          <meta
            name="description"
            content="Sign in with GitHub to access your gists and manage your scratchpad across all platforms"
          />
        </Helmet>
        <div className="min-h-screen bg-white flex flex-col">
          <header className="border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-6 py-6">
              <div className="flex items-center gap-3">
                <img
                  src="/scratch-icon.png"
                  alt="Scratch (Gists) logo"
                  className="w-8 h-8 rounded-lg"
                />
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Scratch (Gists)
                  </h1>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center px-6">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <img
                  src="/scratch-icon.png"
                  alt="Scratch (Gists) logo"
                  className="w-12 h-12 rounded-xl mx-auto mb-6"
                />
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Welcome to Scratch (Gists)
                </h2>
                <p className="text-lg text-gray-600 mb-1">
                  Your cross-platform scratchpad
                </p>
                <p className="text-sm text-gray-500">
                  Sign in with GitHub to access and manage your gists
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={login}
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sign in with GitHub
                  </>
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="text-center text-sm text-gray-500">
                  <p className="mb-2">New to Scratch (Gists)?</p>
                  <p>
                    Connect your GitHub account to start managing your gists
                  </p>
                  <a
                    href="https://marketplace.visualstudio.com/items?itemName=chidimo.scratch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  >
                    Get the VS Code extension →
                  </a>
                </div>
              </div>
            </div>
          </main>

          <footer className="border-t border-gray-100 py-6">
            <div className="max-w-6xl mx-auto px-6 text-center">
              <p className="text-sm text-gray-500">
                &copy; 2026 Scratch (Gists). Built with{' '}
                <span className="text-red-500">❤</span>
                {'. '}
                <a
                  href="/privacy"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </footer>
        </div>
      </>
    );
  }

  if (isLoading && gists.length === 0) {
    return (
      <>
        <Helmet>
          <title>Loading - Scratch (Gists) | Your Cross-Platform Scratchpad</title>
        </Helmet>
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
        <Helmet>
          <title>Error - Scratch (Gists) | Your Cross-Platform Scratchpad</title>
        </Helmet>
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
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchGists}
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
      <Helmet>
        <title>{user?.name || user?.login}'s Gists - Scratch (Gists)</title>
        <meta
          name="description"
          content={`Manage and view ${user?.public_gists} gists from ${user?.name || user?.login} on Scratch (Gists)`}
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/scratch-icon.png"
                  alt="Scratch (Gists) logo"
                  className="w-10 h-10 rounded-xl"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user?.name || user?.login}'s Gists
                  </h1>
                  <p className="text-sm text-gray-600">
                    {user?.public_gists} public gists
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

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
              {gists.map((gist) => (
                <div
                  key={gist.id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-4">
                      <a
                        href={gist.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {gist.description || 'Untitled Gist'}
                      </a>
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(gist.updated_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mb-4">
                    {Object.values(gist.files).map((file) => (
                      <div
                        key={`${gist.id}-${file.filename}`}
                        className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0"
                      >
                        <span className="font-mono text-sm text-gray-700">
                          {file.filename}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                          {file.language || 'Text'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${gist.public
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {gist.public ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <a
                      href={gist.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>
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
}

