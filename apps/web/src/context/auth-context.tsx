import { GitHubUser } from '@scratch/shared';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// Auth context interfaces
interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  setUser: (user: GitHubUser | null) => void;
  setToken: (token: string | null) => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const storedToken = sessionStorage.getItem('github_token');
    const storedUser = sessionStorage.getItem('github_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user data:', err);
        sessionStorage.removeItem('github_token');
        sessionStorage.removeItem('github_user');
      }
    }
  }, []);

  const login = () => {
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

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_user');
  };

  const value: AuthContextType = useMemo(() => {
    return {
      user,
      token,
      isLoading,
      error,
      login,
      logout,
      setUser,
      setToken,
    };
  }, [user, token, isLoading, error, login, logout, setUser, setToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
