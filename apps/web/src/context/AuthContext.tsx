import { createContext, useContext, useEffect, useMemo, useState } from 'react';

// GitHub User interface - matches GitHub API response
interface GitHubUser {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  user_view_type: string;
  site_admin: boolean;
  name: string;
  company: string;
  blog: string;
  location: string;
  email: string;
  hireable: boolean;
  bio: string;
  twitter_username: string | null;
  notification_email: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

// Gist interfaces - matches GitHub API response
interface Gist {
  id: string;
  description: string | null;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: Record<
    string,
    {
      filename: string;
      type: string;
      language: string | null;
      raw_url: string;
      size: number;
    }
  >;
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  html_url: string;
}

// Auth context interfaces
interface AuthContextType {
  user: GitHubUser | null;
  token: string | null;
  gists: Gist[];
  isLoading: boolean;
  error: string | null;
  login: () => void;
  logout: () => void;
  fetchGists: () => Promise<void>;
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
  const [gists, setGists] = useState<Gist[]>([]);
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
    setGists([]);
    sessionStorage.removeItem('github_token');
    sessionStorage.removeItem('github_user');
  };

  const fetchGists = async () => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gists: ${response.statusText}`);
      }

      const gistsData = await response.json();
      setGists(gistsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch gists');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = useMemo(() => {
    return {
      user,
      token,
      gists,
      isLoading,
      error,
      login,
      logout,
      fetchGists,
      setUser,
      setToken,
    };
  }, [
    user,
    token,
    gists,
    isLoading,
    error,
    login,
    logout,
    fetchGists,
    setUser,
    setToken,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
