# Web App Deployment Guide

## Prerequisites

1. **GitHub OAuth App Setup**
   - Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
   - Create a new OAuth App with:
     - **Application name**: Scratch Web
     - **Homepage URL**: `https://your-site.netlify.app`
     - **Authorization callback URL**: `https://your-site.netlify.app/callback`
   - Note the **Client ID** and **Client Secret**

2. **Netlify Account**
   - Create account at [netlify.com](https://netlify.com)
   - Connect your GitHub repository

## Environment Variables

### In Netlify UI

Go to: **Site settings > Build & deploy > Environment > Environment variables**

Add these variables:

```
GITHUB_CLIENT_SECRET=your_github_client_secret_here
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

### In Your Local Development

Create `.env` in root directory:

```
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

## Deployment Steps

### 1. Connect Repository to Netlify

```bash
# Push your changes to GitHub
git add .
git commit -m "Add web app with GitHub OAuth"
git push origin main
```

### 2. Configure Netlify Site

1. In Netlify, click "New site from Git"
2. Choose GitHub repository
3. Configure build settings:
   - **Base directory**: `.` (root)
   - **Build command**: `cd apps/web && npm run build`
   - **Publish directory**: `apps/web/dist`
   - **Node version**: `18`

### 3. Set Environment Variables

Add both variables in Netlify environment variables:

```
GITHUB_CLIENT_SECRET=your_github_client_secret_here
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
```

### 4. Update GitHub OAuth App

Update your GitHub OAuth App callback URL to your Netlify URL:

```
https://your-site.netlify.app/callback
```

## Local Development

```bash
# Install dependencies
yarn install

# Start development server
yarn start:web

# Build for production
yarn build
```

## OAuth Flow

1. User clicks "Sign in with GitHub"
2. Redirected to GitHub OAuth authorization
3. GitHub redirects to `/callback` with authorization code
4. Netlify function exchanges code for access token
5. User is authenticated and redirected to main app

## Security Notes

- **Never commit** `GITHUB_CLIENT_SECRET` to version control
- Use HTTPS in production
- The Netlify function handles the secure token exchange
- State parameter prevents CSRF attacks
- Tokens are stored in sessionStorage (cleared on browser close)

## Console Logs

The OAuth function includes detailed console logging for debugging:

- 🔍 Function calls and request details
- 🔑 Environment variable validation
- 🔄 GitHub API interactions
- ✅ Success states and token info
- ❌ Error details and failure points

View logs in: **Netlify Dashboard > Functions > [function-name] > Logs**

## Troubleshooting

### Common Issues

1. **"GitHub Client ID not configured"**
   - Check `VITE_GITHUB_CLIENT_ID` in Netlify environment variables
   - Restart deployment after changing env vars
   - Verify variable starts with `VITE_` for frontend access

2. **"Token exchange failed"**
   - Verify `GITHUB_CLIENT_SECRET` in Netlify environment variables
   - Check GitHub OAuth App callback URL matches your site URL exactly
   - Review function logs for detailed error information

3. **Build failures**
   - Ensure base directory is set to `.`
   - Check build command: `cd apps/web && npm run build`
   - Verify publish directory: `apps/web/dist`

4. **404 errors**
   - Check redirect rules in `netlify.toml`
   - Ensure function directory is set to `netlify/functions`

### Debug Mode

The function includes comprehensive logging. Check Netlify function logs for:

- Environment variable validation
- GitHub API responses
- Token exchange details
- Error stack traces

### Quick Log Check

After deployment, test the OAuth flow and immediately check:

```
Netlify Dashboard > Functions > github-token > Logs
```

Look for these key log entries:

- `🔍 OAuth function called`
- `🔑 Environment check`
- `🔄 Exchanging code for token`
- `✅ Token exchange successful`
