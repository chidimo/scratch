# Scratch Monorepo

This project has been converted to an Nx monorepo structure with mobile and web applications.

## Structure

```
scratch/
├── apps/
│   ├── mobile/           # React Native/Expo mobile app
│   └── web/              # React + Vite web app
├── libs/
│   ├── shared/
│   │   ├── utils/       # Shared utility functions
│   │   └── types/       # Shared TypeScript types
├── netlify/
│   └── functions/       # Netlify serverless functions
├── nx.json              # Nx workspace configuration
└── package.json         # Root package.json with Nx scripts
```

## Available Commands

### Mobile App

- `yarn start` - Start Expo development server
- `yarn android` - Run on Android
- `yarn ios` - Run on iOS
- `yarn web` - Run on web
- `yarn lint` - Run ESLint

### Web App

- `yarn start:web` - Start Vite development server
- `yarn build` - Build web app for production
- `yarn lint:web` - Run ESLint on web app

### Nx Commands

- `npx nx graph` - View project dependency graph
- `npx nx show projects` - List all projects
- `npx nx show project [project-name]` - Show project details

## Applications

### Mobile App (`apps/mobile`)

- React Native with Expo
- GitHub OAuth integration
- Cross-platform (iOS/Android/Web)

### Web App (`apps/web`)

- React with Vite
- GitHub OAuth with Netlify functions
- Responsive design
- PWA ready

## Adding New Projects

### Add a new library:

```bash
npx nx g @nx/js:lib library-name --directory=libs/shared/library-name
```

### Add a new app:

```bash
npx nx g @nx/react-native:app app-name --directory=apps/app-name
npx nx g @nx/react:app app-name --directory=apps/app-name --bundler=vite
```

## Shared Libraries

- `@scratch/shared` - Shared TypeScript definitions and utilities

Import in your apps:

```typescript
import { someUtil, SomeType } from '@scratch/shared';
```

## Deployment

### Web App

See `WEB_DEPLOYMENT.md` for complete deployment instructions to Netlify.

### Mobile App

Use EAS CLI for deployment:

```bash
yarn build:android
yarn build:ios
```

## OAuth Integration

Both apps use GitHub OAuth with the same flow:

1. User signs in with GitHub
2. Mobile app uses Expo AuthSession
3. Web app uses Netlify functions for secure token exchange
4. Tokens are stored securely and used for GitHub API access
