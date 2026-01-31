import { PUBLIC_AUTH_SCHEME } from '@/constants/app-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthContextType,
  AuthProviderProps,
  AuthState,
  GitHubUser,
} from '@scratch/shared';
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
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: 'https://github.com/settings/connections/applications/',
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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    gists: [],
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

  // Log the redirect URI for debugging
  useEffect(() => {
    if (request) {
      console.log(JSON.stringify(request, null, 2));
      console.log('OAuth Request redirect URI:', request.redirectUri);
    }
  }, [request]);

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
      console.log('Got authorization code:', code.substring(0, 10) + '...');
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
      console.log('Starting sign-in process...');
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

  const completeAuth = useCallback(
    async (code: string, codeVerifier?: string | null) => {
      // Prevent duplicate auth calls
      if (isAuthInProgress) {
        console.log('Auth already in progress, skipping duplicate call');
        return;
      }

      setIsAuthInProgress(true);

      console.log('completeAuth called with:', {
        code: code.substring(0, 10) + '...',
        codeVerifier: codeVerifier
          ? `${codeVerifier.length} chars`
          : 'Not provided',
        timestamp: new Date().toISOString(),
      });

      try {
        // Use the exact redirect URI from the OAuth request
        const actualRedirectUri =
          request?.redirectUri ||
          makeRedirectUri({
            scheme: PUBLIC_AUTH_SCHEME,
            path: 'auth/callback',
          });
        const requestCodeVerifier = request?.codeVerifier;

        console.log('Using redirect URI:', actualRedirectUri);
        console.log(
          'Using PKCE:',
          requestCodeVerifier
            ? `Yes (${requestCodeVerifier.length} chars)`
            : 'No',
        );
        console.log('Request object:', {
          hasCodeVerifier: !!requestCodeVerifier,
          hasRedirectUri: !!actualRedirectUri,
          clientId: GITHUB_CLIENT_ID?.substring(0, 10) + '...',
        });

        // Exchange code for token directly with GitHub (as per Expo docs)
        const tokenUrl = 'https://github.com/login/oauth/access_token';

        const requestBody: any = {
          client_id: GITHUB_CLIENT_ID!,
          client_secret: process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: actualRedirectUri,
        };

        // Use code verifier from parameter first, then from request
        const finalCodeVerifier = codeVerifier || requestCodeVerifier;
        if (finalCodeVerifier) {
          requestBody.code_verifier = finalCodeVerifier;
        }

        console.log('Token exchange request body:', {
          ...requestBody,
          client_secret: requestBody.client_secret
            ? '***PRESENT***'
            : '***MISSING***',
          code_verifier: requestBody.code_verifier
            ? `${requestBody.code_verifier.length} chars`
            : 'Not using PKCE',
        });

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        console.log('Token exchange response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Token exchange failed:', errorText);
          throw new Error(
            `Failed to exchange code for token: ${response.status} - ${errorText}`,
          );
        }

        const tokenData = await response.json();
        console.log('Token exchange result:', tokenData);

        if (tokenData.access_token) {
          console.log('Got access token, fetching user profile...');
          const user = await fetchUserProfile(tokenData.access_token);

          await AsyncStorage.setItem('github_token', tokenData.access_token);
          await AsyncStorage.setItem('github_user', JSON.stringify(user));

          console.log('Setting auth state to authenticated');
          setAuthState({
            user,
            token: tokenData.access_token,
            gists: [],
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

  const fetchUserProfile = async (token: string): Promise<GitHubUser> => {
    console.log(
      'Fetching user profile with token:',
      token.substring(0, 10) + '...',
    );

    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        'User-Agent': 'ScratchApp',
      },
    });

    console.log('User profile response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user profile:', errorText);
      throw new Error(
        `Failed to fetch user profile: ${response.status} - ${errorText}`,
      );
    }

    const userData = await response.json();
    console.log('User data received:', {
      login: userData.login,
      id: userData.id,
      email: userData.email,
    });

    try {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'ScratchApp',
        },
      });

      console.log('Emails response status:', emailResponse.status);

      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        console.log(
          'Emails data received:',
          Array.isArray(emails) ? `${emails.length} emails` : 'Not an array',
        );

        // Check if emails is an array before using find
        if (Array.isArray(emails)) {
          const primaryEmail =
            emails.find((email: any) => email.primary && email.verified)
              ?.email || userData.email;
          console.log('Primary email found:', primaryEmail);
          return {
            ...userData,
            email: primaryEmail,
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch user emails, using default email:', error);
    }

    // Fallback to user data email if email fetch fails
    return {
      ...userData,
      email: userData.email || '',
    };
  };

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

export default AuthProvider;
