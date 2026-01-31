import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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
interface AuthState {
  user: GitHubUser | null;
  token: string | null;
  gists: Gist[];
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchGists: () => Promise<void>;
  completeAuth: (code: string, codeVerifier?: string | null) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET;
const GITHUB_OAUTH_PROXY_URL = process.env.EXPO_PUBLIC_GITHUB_OAUTH_PROXY_URL;

console.log(
  'Environment check - Client ID:',
  GITHUB_CLIENT_ID ? 'Set' : 'Not set',
);
console.log(
  'Environment check - Client Secret:',
  GITHUB_CLIENT_SECRET ? 'Set' : 'Not set',
);

const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint:
    'https://github.com/settings/connections/applications/' + GITHUB_CLIENT_ID,
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    gists: [],
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('github_token');
      const storedUser = await AsyncStorage.getItem('github_user');
      const storedGists = await AsyncStorage.getItem('github_gists');

      if (storedToken && storedUser) {
        setAuthState({
          user: JSON.parse(storedUser),
          token: storedToken,
          gists: storedGists ? JSON.parse(storedGists) : [],
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load stored authentication',
      }));
    }
  };

  const completeAuth = useCallback(
    async (code: string, codeVerifier?: string | null) => {
      console.log('completeAuth called with:', {
        code: code.substring(0, 10) + '...',
        codeVerifier: codeVerifier ? 'Present' : 'Missing',
      });

      try {
        const tokenResponse = codeVerifier
          ? await exchangeCodeForToken(code, codeVerifier)
          : await exchangeCodeForTokenWeb(code);

        if (tokenResponse.access_token) {
          console.log('Got access token, fetching user profile...');
          const user = await fetchUserProfile(tokenResponse.access_token);

          await AsyncStorage.setItem(
            'github_token',
            tokenResponse.access_token,
          );
          await AsyncStorage.setItem('github_user', JSON.stringify(user));

          console.log('Setting auth state to authenticated');
          setAuthState({
            user,
            token: tokenResponse.access_token,
            gists: [],
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          console.error('No access token in response:', tokenResponse);
          setAuthState((prev) => ({
            ...prev,
            error: 'Failed to get access token',
          }));
        }
      } catch (error) {
        console.error('Error completing auth:', error);
        throw error;
      }
    },
    [],
  );

  const signIn = useCallback(async () => {
    try {
      console.log('Starting sign-in process...');

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'scratch',
        path: 'auth/callback',
        preferLocalhost: true,
      });

      console.log('Generated redirect URI:', { redirectUri });
      console.log('Client ID:', GITHUB_CLIENT_ID);

      // Use the standard OAuth flow with AuthSession
      const request = new AuthSession.AuthRequest({
        clientId: GITHUB_CLIENT_ID!,
        scopes: ['gist', 'user:email'],
        redirectUri,
        usePKCE: true,
      });

      console.log('AuthRequest created with PKCE enabled');

      if (request.codeVerifier) {
        await AsyncStorage.setItem('pkce_code_verifier', request.codeVerifier);
      }

      const result = await request.promptAsync(discovery);
      console.log('OAuth result:', result.type);

      if (result.type === 'success') {
        console.log('Got authorization code, waiting for callback route');
      }
    } catch (error) {
      console.error('Error during sign in:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        'github_token',
        'github_user',
        'github_gists',
      ]);
      setAuthState({
        user: null,
        token: null,
        gists: [],
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, []);

  const fetchGists = useCallback(async () => {
    if (!authState.token) {
      throw new Error('No authentication token available');
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('https://api.github.com/gists', {
        headers: {
          Authorization: `token ${authState.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch gists: ${response.statusText}`);
      }

      const gistsData = await response.json();

      await AsyncStorage.setItem('github_gists', JSON.stringify(gistsData));

      setAuthState((prev) => ({
        ...prev,
        gists: gistsData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch gists';
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [authState.token]);

  const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
    console.log('Exchanging code for token...', {
      code: code.substring(0, 10) + '...',
      codeVerifier: codeVerifier ? 'Present' : 'Missing',
    });

    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
        }),
      },
    );

    console.log('Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status}`);
    }

    const result = await response.json();
    console.log('Token exchange result:', result);
    return result;
  };

  const exchangeCodeForTokenWeb = async (code: string) => {
    console.log('Exchanging code for token (web, no PKCE)...', {
      code: code.substring(0, 10) + '...',
    });

    if (!GITHUB_OAUTH_PROXY_URL) {
      throw new Error(
        'Missing EXPO_PUBLIC_GITHUB_OAUTH_PROXY_URL. Web token exchange must go through your own backend to avoid CORS.',
      );
    }

    const response = await fetch(GITHUB_OAUTH_PROXY_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    console.log('Web token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Web token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status}`);
    }

    const result = await response.json();
    console.log('Web token exchange result:', result);
    return result;
  };

  const fetchUserProfile = async (token: string): Promise<GitHubUser> => {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ScratchApp',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const userData = await response.json();

    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ScratchApp',
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail =
      emails.find((email: any) => email.primary && email.verified)?.email ||
      userData.email;

    return {
      ...userData,
      email: primaryEmail,
    };
  };

  const value = useMemo(
    () => ({
      ...authState,
      signIn,
      signOut,
      fetchGists,
      completeAuth,
    }),
    [authState, signIn, signOut, fetchGists, completeAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
