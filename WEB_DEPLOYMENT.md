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
```

### In Your Local Development
Create `apps/web/.env.local`:
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
   - **Base directory**: `apps/web`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

### 3. Set Environment Variables
Add the `GITHUB_CLIENT_SECRET` in Netlify environment variables

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

## Troubleshooting

### Common Issues

1. **"GitHub Client ID not configured"**
   - Check `VITE_GITHUB_CLIENT_ID` in `.env.local`
   - Restart development server after changing env vars

2. **"Token exchange failed"**
   - Verify `GITHUB_CLIENT_SECRET` in Netlify environment variables
   - Check GitHub OAuth App callback URL matches your site URL

3. **CORS errors**
   - Ensure Netlify function is properly deployed
   - Check `netlify.toml` configuration

### Debug Mode

Add temporary logging to the OAuth function:
```typescript
console.log('Request received:', { code, redirect_uri });
console.log('Environment check:', { 
  clientId: !!process.env.GITHUB_CLIENT_ID,
  clientSecret: !!process.env.GITHUB_CLIENT_SECRET 
});
```
