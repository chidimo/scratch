import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Callback() {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(globalThis.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`GitHub OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing required OAuth parameters');
        }

        // Verify state to prevent CSRF attacks
        const storedState = sessionStorage.getItem('oauth_state');
        if (!storedState || storedState !== state) {
          throw new Error('Invalid state parameter');
        }

        const functionBaseUrl = import.meta.env.DEV
          ? `http://localhost:8787/oauth`
          : '/.netlify/functions';

        const functionUrl = `${functionBaseUrl}/github-token`;
        const redirectUri = `${globalThis.location.origin}/callback`;

        const tokenResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        });

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          throw new Error(
            errorData.error_description ||
              errorData.error ||
              'Token exchange failed',
          );
        }

        const tokenData = await tokenResponse.json();

        // Store token securely
        sessionStorage.setItem('github_token', tokenData.access_token);
        setToken(tokenData.access_token);

        // Get user information
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${tokenData.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error('Failed to fetch user information');
        }

        const userData = await userResponse.json();

        // Store user data and update context
        sessionStorage.setItem('github_user', JSON.stringify(userData));
        setUser(userData);

        setStatus('success');

        // Check if this is a mobile redirect request
        const callbackUrlParams = new URLSearchParams(
          globalThis.location.search,
        );
        const stateParam = callbackUrlParams.get('state');

        if (stateParam?.startsWith('mobile_')) {
          // This is a mobile request, redirect back to mobile app
          // The mobile app will handle the token from AsyncStorage
          const mobileRedirectUri = `scratch://auth/callback?success=true`;
          setTimeout(() => {
            globalThis.location.href = mobileRedirectUri;
          }, 1500);
          return;
        }

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, setUser, setToken]);

  return (
    <>
      <Helmet>
        <title>
          Authentication - Scratch (Gists) | Your Cross-Platform Scratchpad
        </title>
        <meta
          name="description"
          content="Completing GitHub authentication for Scratch (Gists)"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Authenticating...
              </h2>
              <p className="text-gray-600">
                Please wait while we complete the sign-in process.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Success!
              </h2>
              <p className="text-gray-600">
                You're now signed in. Redirecting to your gists...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Callback;
