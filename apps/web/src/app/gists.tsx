import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Gists() {
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
      <div className="app">
        <header className="header">
          <h1>Scratch</h1>
          <p>Your cross-platform scratchpad system</p>
        </header>

        <main className="main">
          <div className="login-section">
            <h2>Get Started</h2>
            <p>Sign in with GitHub to access your gists</p>

            {error && <div className="error-message">Error: {error}</div>}

            <button
              onClick={login}
              disabled={isLoading}
              className="github-login-button"
            >
              {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
            </button>
          </div>
        </main>

        <footer className="footer">
          <p>&copy; 2026 Scratch</p>
        </footer>
      </div>
    );
  }

  if (isLoading && gists.length === 0) {
    return (
      <div className="gists">
        <div className="loading">
          <div className="spinner"></div>
          <h2>Loading your gists...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gists">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchGists} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gists">
      <header className="gists-header">
        <div className="user-info">
          <img src={user?.avatar_url} alt={user?.login} className="avatar" />
          <div className="user-details">
            <h1>{user?.name || user?.login}'s Gists</h1>
            <p>{user?.public_gists} public gists</p>
          </div>
        </div>
        <button onClick={logout} className="logout-button">
          Sign Out
        </button>
      </header>

      <main className="gists-main">
        {gists.length === 0 ? (
          <div className="empty-state">
            <h2>No gists found</h2>
            <p>You haven't created any public gists yet.</p>
            <a
              href="https://gist.github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="create-gist-button"
            >
              Create Your First Gist
            </a>
          </div>
        ) : (
          <div className="gists-list">
            {gists.map((gist) => (
              <div key={gist.id} className="gist-card">
                <div className="gist-header">
                  <h3>
                    <a
                      href={gist.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {gist.description || 'Untitled Gist'}
                    </a>
                  </h3>
                  <span className="gist-date">
                    {new Date(gist.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="gist-files">
                  {Object.values(gist.files).map((file) => (
                    <div
                      key={`${gist.id}-${file.filename}`}
                      className="file-info"
                    >
                      <span className="file-name">{file.filename}</span>
                      <span className="file-language">
                        {file.language || 'Text'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="gist-footer">
                  <span
                    className={`visibility ${gist.public ? 'public' : 'private'}`}
                  >
                    {gist.public ? '🌐 Public' : '🔒 Private'}
                  </span>
                  <a
                    href={gist.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-gist-link"
                  >
                    View on GitHub →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && gists.length > 0 && (
          <div className="loading-more">
            <div className="spinner small"></div>
            <span>Refreshing...</span>
          </div>
        )}
      </main>
    </div>
  );
}

export default Gists;
