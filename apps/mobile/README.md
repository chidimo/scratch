# Mobile App - GitHub Authentication Setup

## Environment Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Fill in your GitHub OAuth credentials:

- Get credentials from: https://github.com/settings/applications/new
- Set Authorization callback URL to: `scratch://auth/callback`

## Authentication Flow

The mobile app uses:

- **PKCE (Proof Key for Code Exchange)** for secure OAuth flow
- **Expo AuthSession** for handling OAuth redirects
- **AsyncStorage** for persisting auth tokens and user data

## Key Components

- `context/AuthContext.tsx` - Main authentication state management
- `auth/callback.tsx` - Handles OAuth callback from GitHub
- `app.json` - Configured with `scheme: "scratch"` for deep linking

## Usage

```tsx
import { useAuth } from '../context/AuthContext';

const { signIn, signOut, user, isAuthenticated, fetchGists } = useAuth();
```

## Features

- ✅ Secure PKCE OAuth flow
- ✅ Token persistence
- ✅ User profile fetching
- ✅ Gists fetching
- ✅ Error handling
- ✅ Loading states
