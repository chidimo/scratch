import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const GistDetail = () => {
  const { gistId } = useParams();
  const { user, gists, isLoading, error, fetchGists, login } = useAuth();

  useEffect(() => {
    if (user && gists.length === 0 && !isLoading) {
      fetchGists();
    }
  }, [user, gists.length, isLoading, fetchGists]);

  const gist = useMemo(
    () => gists.find((item) => item.id === gistId),
    [gists, gistId]
  );

  if (!user) {
    return (
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
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to gists
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isLoading && gists.length === 0) {
    return (
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
  }

  if (error) {
    return (
      <>
        <Helmet>
          <title>Error - Scratch (Gists)</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={fetchGists}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Back to gists
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!gist) {
    return (
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
  }

  const files = Object.values(gist.files);

  return (
    <>
      <Helmet>
        <title>
          {gist.description || 'Untitled Gist'} - Scratch (Gists)
        </title>
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
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${gist.public
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Files ({files.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {files.map((file) => (
                <div
                  key={`${gist.id}-${file.filename}`}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-mono text-sm text-gray-800">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">{file.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                      {file.language || 'Text'}
                    </span>
                    <a
                      href={file.raw_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Raw
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

