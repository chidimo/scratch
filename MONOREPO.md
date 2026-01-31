# Scratch Monorepo

This project has been converted to an Nx monorepo structure.

## Structure

```
scratch/
├── apps/
│   └── mobile/           # React Native/Expo mobile app
├── libs/
│   ├── shared/
│   │   ├── utils/       # Shared utility functions
│   │   └── types/       # Shared TypeScript types
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

### Nx Commands
- `npx nx graph` - View project dependency graph
- `npx nx show projects` - List all projects
- `npx nx show project mobile` - Show mobile project details

## Adding New Projects

### Add a new library:
```bash
npx nx g @nx/js:lib library-name --directory=libs/shared/library-name
```

### Add a new app:
```bash
npx nx g @nx/react-native:app app-name --directory=apps/app-name
```

## Shared Libraries

- `@scratch/shared/utils` - Common utility functions
- `@scratch/shared/types` - Shared TypeScript definitions

Import in your apps:
```typescript
import { someUtil } from '@scratch/shared/utils';
import { SomeType } from '@scratch/shared/types';
```
