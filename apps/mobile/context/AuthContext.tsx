import {
    GISTS_STORAGE_KEY,
    GITHUB_ENDPOINT,
    PUBLIC_AUTH_SCHEME,
    TOKEN_STORAGE_KEY,
    USER_STORAGE_KEY,
} from '@/constants/app-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthProviderProps, AuthState } from '@scratch/shared';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

// GitHub OAuth discovery endpoints
const discovery = {
  tokenEndpoint: `${GITHUB_ENDPOINT}/login/oauth/access_token`,
  authorizationEndpoint: `${GITHUB_ENDPOINT}/login/oauth/authorize`,
  revocationEndpoint: `${GITHUB_ENDPOINT}/settings/connections/applications/`,
};

// Environment variables
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET;
const AUTH_USE_PROXY =
  process.env.EXPO_PUBLIC_AUTH_USE_PROXY?.toLowerCase() !== 'false';

const validateEnv = (): string[] => {
  const missing: string[] = [];

  if (!GITHUB_CLIENT_ID) {
    missing.push('EXPO_PUBLIC_GITHUB_CLIENT_ID');
  }
  if (!GITHUB_CLIENT_SECRET) {
    missing.push('EXPO_PUBLIC_GITHUB_CLIENT_SECRET');
  }
  if (!PUBLIC_AUTH_SCHEME) {
    missing.push('PUBLIC_AUTH_SCHEME');
  }

  return missing;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Track if auth is in progress to prevent duplicate calls
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  // Use Expo's useAuthRequest hook
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID!,
      scopes: ['gist', 'read:user'],
      redirectUri: makeRedirectUri({
        scheme: PUBLIC_AUTH_SCHEME,
        path: 'auth/callback',
      }),
    },
    discovery,
  );

  useEffect(() => {
    const missing = validateEnv();
    if (missing.length > 0) {
      const message = `Missing required environment variables: ${missing.join(
        ', ',
      )}`;
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw new Error(message);
    }
  }, []);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

      if (storedToken) {
        setAuthState({
          token: storedToken,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'No stored authentication found',
        }));
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

  useEffect(() => {
    // Handle auth response
    if (response?.type === 'success') {
      const { code } = response.params;
      completeAuth(code);
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Authentication error: ${response.error}`,
      }));
    }
  }, [response]);

  useEffect(() => {
    // Complete auth session when app starts
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const signIn = useCallback(async () => {
    try {
      await promptAsync();
    } catch (error) {
      console.error('Error during sign in:', error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [promptAsync]);

  const signOut = useCallback(async () => {
    try {
      // Clear all AsyncStorage data
      await AsyncStorage.multiRemove([
        TOKEN_STORAGE_KEY,
        USER_STORAGE_KEY,
        GISTS_STORAGE_KEY,
      ]);

      // Reset auth state
      setAuthState({
        token: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, []);

  const completeAuth = useCallback(
    async (code: string, codeVerifier?: string | null) => {
      // Prevent duplicate auth calls
      if (isAuthInProgress) {
        return;
      }

      setIsAuthInProgress(true);

      try {
        // Use the exact redirect URI from the OAuth request
        const actualRedirectUri =
          request?.redirectUri ||
          makeRedirectUri({
            scheme: PUBLIC_AUTH_SCHEME,
            path: 'auth/callback',
          });
        const requestCodeVerifier = request?.codeVerifier;

        // Exchange code for token directly with GitHub (as per Expo docs)
        const tokenUrl = `${GITHUB_ENDPOINT}/login/oauth/access_token`;

        const requestBody: any = {
          client_id: GITHUB_CLIENT_ID!,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: actualRedirectUri,
        };

        // Use code verifier from parameter first, then from request
        const finalCodeVerifier = codeVerifier || requestCodeVerifier;
        if (finalCodeVerifier) {
          requestBody.code_verifier = finalCodeVerifier;
        }

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(
            `Failed to exchange code for token: ${response.status} - ${errorText}`,
          );
        }

        const tokenData = await response.json();

        if (tokenData.access_token) {
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, tokenData.access_token);

          setAuthState({
            token: tokenData.access_token,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          console.error('No access token in response:', tokenData);
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Failed to get access token',
          }));
        }
      } catch (error) {
        console.error('Error completing auth:', error);
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error ? error.message : 'Authentication failed',
        }));
      } finally {
        setIsAuthInProgress(false);
      }
    },
    [request?.redirectUri, request?.codeVerifier, isAuthInProgress],
  );

  const value = useMemo(
    () => ({
      ...authState,
      signIn,
      signOut,
      completeAuth,
    }),
    [authState, signIn, signOut, completeAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
