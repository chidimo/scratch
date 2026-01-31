import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Callback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
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

        // Exchange code for token using our Netlify function
        const functionUrl = import.meta.env.VITE_NETLIFY_FUNCTIONS_URL
          ? `${import.meta.env.VITE_NETLIFY_FUNCTIONS_URL}/.netlify/functions/github-token`
          : '/.netlify/functions/github-token';

        const tokenResponse = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: import.meta.env.VITE_NETLIFY_FUNCTIONS_URL
              ? `${import.meta.env.VITE_NETLIFY_FUNCTIONS_URL}/callback`
              : `${window.location.origin}/callback`,
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

        // Store user data and redirect to main app
        sessionStorage.setItem('github_user', JSON.stringify(userData));
        setStatus('success');

        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="callback">
      <div className="callback-content">
        {status === 'loading' && (
          <>
            <div className="spinner"></div>
            <h2>Authenticating...</h2>
            <p>Please wait while we complete the sign-in process.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>Success!</h2>
            <p>You're now signed in. Redirecting to the app...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Authentication Failed</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>Back to Login</button>
          </>
        )}
      </div>
    </div>
  );
}

export default Callback;
