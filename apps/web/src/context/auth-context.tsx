import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { WebStorageKeys } from '../lib/constants';

interface AuthContextType {
  hasToken: boolean;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  onCallbackSuccess: (token: string | null) => void;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session on app load
    const storedToken = sessionStorage.getItem(WebStorageKeys.GITHUB_TOKEN);

    if (storedToken) {
      try {
        setToken(storedToken);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        sessionStorage.removeItem(WebStorageKeys.GITHUB_TOKEN);
      }
    }
  }, []);

  const login = () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate random state for security
      const state = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem(WebStorageKeys.OAUTH_STATE, state);

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
    setToken(null);
    sessionStorage.removeItem(WebStorageKeys.GITHUB_TOKEN);
    sessionStorage.removeItem(WebStorageKeys.OAUTH_STATE);
  };

  const onCallbackSuccess = (token: string | null) => {
    if (!token) {
      return;
    }
    setToken(token);
    sessionStorage.setItem(WebStorageKeys.GITHUB_TOKEN, token);
  };

  const value: AuthContextType = useMemo(() => {
    return {
      hasToken: !!token,
      token,
      isLoading,
      error,
      login,
      logout,
      onCallbackSuccess,
    };
  }, [token, isLoading, error, login, logout, onCallbackSuccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
