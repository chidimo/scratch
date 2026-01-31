import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import '../styles.css';
import Callback from './callback';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

export function App() {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const token = sessionStorage.getItem('github_token');
    const userData = sessionStorage.getItem('github_user');

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error('Failed to parse user data:', err);
        sessionStorage.removeItem('github_token');
        sessionStorage.removeItem('github_user');
      }
    }
  }, []);

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate random state for security
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('oauth_state', state);

      // GitHub OAuth configuration
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = `${globalThis.location.origin}/callback`;

      if (!clientId) {
        throw new Error('GitHub Client ID not configured');
      }

      // Redirect to GitHub OAuth
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'user:email gist');
      authUrl.searchParams.set('state', state);

      globalThis.location.href = authUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate login');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_user');
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <header className="header">
              <h1>Scratch</h1>
              <p>Your cross-platform scratchpad system</p>
            </header>

            <main className="main">
              {user ? (
                <div className="user-profile">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="avatar"
                  />
                  <h2>Welcome, {user.name || user.login}!</h2>
                  <p>You're successfully signed in with GitHub.</p>
                  <button onClick={handleLogout} className="logout-button">
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="login-section">
                  <h2>Get Started</h2>
                  <p>Sign in with GitHub to access your scratchpad</p>

                  {error && <div className="error-message">Error: {error}</div>}

                  <button
                    onClick={handleGitHubLogin}
                    disabled={isLoading}
                    className="github-login-button"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
                  </button>
                </div>
              )}
            </main>

            <footer className="footer">
              <p>&copy; 2024 Scratch. Built with React & Vite.</p>
            </footer>
          </div>
        }
      />
      <Route path="/callback" element={<Callback />} />
    </Routes>
  );
}

export default App;
