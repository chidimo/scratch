import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, AuthProviderProps } from '@scratch/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useUserProfile } from '../hooks/use-user-profile';
import { PUBLIC_AUTH_SCHEME } from '@/constants/app-constants';

// GitHub OAuth discovery endpoints
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: `https://github.com/settings/connections/applications/${process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID}`,
};

// Environment variables
const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
const AUTH_USE_PROXY =
  process.env.EXPO_PUBLIC_AUTH_USE_PROXY?.toLowerCase() !== 'false';

console.log(
  'Environment check - Client ID:',
  GITHUB_CLIENT_ID ? 'Set' : 'Not set',
);
console.log('Environment check - Auth proxy:', AUTH_USE_PROXY ? 'On' : 'Off');
console.log('Environment check - Auth scheme:', PUBLIC_AUTH_SCHEME);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const [isAuthInProgress, setIsAuthInProgress] = useState(false);

  // Use Expo's useAuthRequest hook
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID || '',
      scopes: ['gist', 'read:user'],
      redirectUri: makeRedirectUri({
        scheme: PUBLIC_AUTH_SCHEME,
        path: 'auth/callback',
      }),
    },
    discovery,
  );

  // Query for stored auth state (token only)
  const { data: storedAuthData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['auth'],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem('github_token');
        const userStr = await AsyncStorage.getItem('github_user');

        if (token && userStr) {
          const user = JSON.parse(userStr);

          return {
            user,
            token,
            gists: [], // Gists will be managed by the use-gists hook
            isLoading: false,
            isAuthenticated: true,
            error: null,
          };
        }

        return {
          user: null,
          token: null,
          gists: [],
          isLoading: false,
          isAuthenticated: false,
          error: null,
        };
      } catch (error) {
        console.error('Error loading stored auth:', error);
        return {
          user: null,
          token: null,
          gists: [],
          isLoading: false,
          isAuthenticated: false,
          error: 'Failed to load authentication state',
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for user profile using the new hook
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useUserProfile(storedAuthData?.token || null);

  // Combine stored auth data with fresh user profile
  const authData = useMemo(() => {
    if (!storedAuthData) {
      return {
        user: null,
        token: null,
        gists: [],
        isLoading: isAuthLoading,
        isAuthenticated: false,
        error: null,
      };
    }

    return {
      ...storedAuthData,
      user: userProfile || storedAuthData.user, // Use fresh profile if available, fallback to stored
      isLoading: isAuthLoading || isProfileLoading,
      error: profileError
        ? profileError instanceof Error
          ? profileError.message
          : profileError
        : storedAuthData.error,
    };
  }, [
    storedAuthData,
    userProfile,
    isAuthLoading,
    isProfileLoading,
    profileError,
  ]);

  // Mutation for completing authentication
  const completeAuthMutation = useMutation({
    mutationFn: async ({
      code,
      codeVerifier,
    }: {
      code: string;
      codeVerifier?: string | null;
    }) => {
      if (!GITHUB_CLIENT_ID) {
        throw new Error('GitHub client ID is not configured');
      }

      if (isAuthInProgress) {
        throw new Error('Authentication is already in progress');
      }

      setIsAuthInProgress(true);

      try {
        console.log('completeAuth called with:', {
          code: code.substring(0, 10) + '...',
          codeVerifier: codeVerifier
            ? `${codeVerifier.length} chars`
            : 'Not provided',
          timestamp: new Date().toISOString(),
        });

        // Use the exact redirect URI from the OAuth request
        const actualRedirectUri =
          request?.redirectUri ||
          makeRedirectUri({
            scheme: PUBLIC_AUTH_SCHEME,
            path: 'auth/callback',
          });
        const requestCodeVerifier = request?.codeVerifier;

        console.log('Using redirect URI:', actualRedirectUri);
        console.log('Using PKCE:', requestCodeVerifier ? 'Yes' : 'No');

        // Use code verifier from parameter first, then from request
        const finalCodeVerifier = codeVerifier || request?.codeVerifier;

        if (!finalCodeVerifier) {
          throw new Error('No code verifier available');
        }

        console.log('Exchanging authorization code for token...');
        console.log('Code:', code.substring(0, 10) + '...');
        console.log(
          'Code verifier:',
          finalCodeVerifier.substring(0, 10) + '...',
        );

        // Exchange authorization code for token
        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
          body: new URLSearchParams({
            client_id: GITHUB_CLIENT_ID!,
            code,
            redirect_uri:
              request?.redirectUri ||
              makeRedirectUri({
                scheme: PUBLIC_AUTH_SCHEME,
                path: 'auth/callback',
              }),
            code_verifier: finalCodeVerifier,
          }),
        });

        console.log('Token exchange response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(
            `Token exchange failed: ${tokenResponse.status} - ${errorText}`,
          );
        }

        const tokenData = await tokenResponse.json();
        console.log('Token data received:', {
          access_token: tokenData.access_token ? 'Present' : 'Missing',
          token_type: tokenData.token_type,
          scope: tokenData.scope,
        });

        if (!tokenData.access_token) {
          throw new Error('No access token received');
        }

        // Store token
        await AsyncStorage.setItem('github_token', tokenData.access_token);

        // Invalidate user profile cache to trigger fresh fetch
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });

        // Return basic auth state - user profile will be fetched by the hook
        return {
          user: null, // Will be populated by useUserProfile hook
          token: tokenData.access_token,
          gists: [],
          isLoading: false,
          isAuthenticated: true,
          error: null,
        };
      } finally {
        setIsAuthInProgress(false);
      }
    },
    onSuccess: (newAuthState) => {
      queryClient.setQueryData(['auth'], newAuthState);
    },
    onError: (error) => {
      console.error('Error completing auth:', error);
    },
  });

  // Mutation for signing out
  const signOutMutation = useMutation({
    mutationFn: async () => {
      try {
        await AsyncStorage.removeItem('github_token');
        await AsyncStorage.removeItem('github_user');
        // Note: gists cache is managed by the use-gists hook

        // Clear user profile cache
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });

        return {
          user: null,
          token: null,
          gists: [],
          isLoading: false,
          isAuthenticated: false,
          error: null,
        };
      } catch (error) {
        console.error('Error during sign out:', error);
        throw error;
      }
    },
    onSuccess: (newAuthState) => {
      queryClient.setQueryData(['auth'], newAuthState);
    },
  });

  // Log the redirect URI for debugging
  useEffect(() => {
    if (request) {
      console.log(JSON.stringify(request, null, 2));
      console.log('OAuth Request redirect URI:', request.redirectUri);
    }
  }, [request]);

  // Handle auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Got authorization code:', code.substring(0, 10) + '...');
      completeAuthMutation.mutate({ code });
    } else if (response?.type === 'error') {
      console.error('Auth error:', response.error);
      queryClient.setQueryData(['auth'], (old: any) => ({
        ...old,
        isLoading: false,
        error: `Authentication error: ${response.error}`,
      }));
    }
  }, [response, completeAuthMutation, queryClient]);

  // Complete auth session when app starts
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const signIn = useCallback(async () => {
    if (!GITHUB_CLIENT_ID) {
      console.error('GitHub client ID is not configured');
      return;
    }

    if (isAuthInProgress) {
      console.log('Authentication is already in progress');
      return;
    }

    try {
      const result = await promptAsync();
      console.log('Auth request result:', result);
    } catch (error) {
      console.error('Error during auth request:', error);
      queryClient.setQueryData(['auth'], (old: any) => ({
        ...old,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  }, [promptAsync, isAuthInProgress, queryClient]);

  const completeAuth = useCallback(
    async (code: string, codeVerifier?: string | null) => {
      completeAuthMutation.mutate({ code, codeVerifier });
    },
    [completeAuthMutation],
  );

  const signOut = useCallback(async () => {
    signOutMutation.mutate();
  }, [signOutMutation]);

  const fetchGists = useCallback(async () => {
    // This function is deprecated - use the useGistOperations hook instead
    console.warn(
      'fetchGists is deprecated. Use the useGistOperations hook from hooks/use-gists.ts instead.',
    );
  }, []);

  const value = useMemo(
    () => ({
      ...authData,
      isLoading:
        authData?.isLoading ||
        isAuthLoading ||
        completeAuthMutation.isPending ||
        signOutMutation.isPending,
      signIn,
      signOut,
      fetchGists,
      completeAuth,
    }),
    [
      authData,
      isAuthLoading,
      completeAuthMutation.isPending,
      signOutMutation.isPending,
      signIn,
      signOut,
      fetchGists,
      completeAuth,
    ],
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
