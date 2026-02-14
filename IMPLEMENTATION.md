# Implementation Plans & Technical Findings

This document consolidates technical findings, implementation decisions, and architectural plans for the Scratchpad project.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [VSCode Extension](#vscode-extension)
- [Web Application](#web-application)
- [Mobile Application](#mobile-application)
- [Shared Components](#shared-components)
- [Data Models](#data-models)
- [API Integration](#api-integration)
- [Performance Optimizations](#performance-optimizations)
- [Security Considerations](#security-considerations)
- [Future Enhancements](#future-enhancements)

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   VSCode        │    │   Web App       │    │   Mobile App    │
│   Extension     │    │   (Next.js)     │    │   (React Native)│
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      GitHub API           │
                    │   (Gists, OAuth, Auth)    │
                    └───────────────────────────┘
```

### Technology Stack

- **Extension**: TypeScript, VSCode Extension API
- **Web**: Next.js, React, TypeScript, Tailwind CSS
- **Mobile**: React Native, TypeScript, Expo
- **Backend**: GitHub API (serverless)
- **Auth**: GitHub OAuth, NextAuth.js

## 🔌 VSCode Extension

### Core Architecture

#### Extension Structure
```
src/
├── extension.ts           # Main extension entry point
├── auth/
│   └── github.ts         # GitHub authentication
├── config.ts              # Configuration management
├── constants.ts           # Centralized constants
├── services/
│   └── gist-sync.ts       # GitHub API integration
├── utils/
│   ├── git.ts            # Git user identity
│   └── scratch.ts        # File system operations
└── views/
    └── gist-tree.ts      # Tree view provider
```

#### Key Components

**Extension Activation (`extension.ts`)**
- Registers commands and tree providers
- Sets up file watchers
- Manages authentication state
- Handles configuration changes

**Tree View Provider (`views/gist-tree.ts`)**
- Hierarchical display of gists and notes
- Inline actions for CRUD operations
- Real-time updates based on file changes

**GitHub Integration (`services/gist-sync.ts`)**
- OAuth authentication flow
- Gist CRUD operations
- Rate limit handling
- Error recovery mechanisms

### Implementation Decisions

#### Rate Limit Management
```typescript
// Constants for rate limit protection
export const GIST_UPDATE_DEBOUNCE_MS = 5000; // 5 seconds
export const DEFAULT_AUTO_REFRESH_MINUTES = 30; // 30 minutes
```

**Rationale**: GitHub API limits (60/hour unauthenticated, 5000/hour authenticated) require careful rate limiting. Debouncing prevents excessive API calls during rapid file changes.

#### File System Strategy
```typescript
// Local-first approach with deferred sync
async function handleDeleteNote(): Promise<void> {
  // Delete immediately locally
  await vscode.workspace.fs.delete(fileUri);
  
  // Warn about deferred GitHub sync
  vscode.window.showWarningMessage(
    'Note deleted locally. GitHub sync will happen during next refresh.'
  );
}
```

**Rationale**: Local-first approach provides better UX and reduces rate limit issues. GitHub sync happens during periodic refreshes.

#### Configuration Management
```typescript
// Centralized configuration with defaults
export const DEFAULT_CONFIG = {
  storagePath: '~/.scratch',
  scratchFolderName: '.scratch',
  autoCreateScratchFolder: true,
  watchScratchFolder: true,
  userIdStrategy: 'git',
  gistAutoRefreshMinutes: 30,
} as const;
```

**Rationale**: Centralized configuration makes maintenance easier and ensures consistency across platforms.

### Technical Challenges & Solutions

#### Challenge 1: VSCode Tree View Limitations
**Problem**: VSCode TreeDataProvider doesn't support dynamic collapsible state changes.

**Solution**: Default to expanded state and removed collapse/expand functionality.
```typescript
// Always expanded for gist folders
new GistTreeItem(
  'gist',
  name,
  vscode.TreeItemCollapsibleState.Expanded,
)
```

#### Challenge 2: GitHub API Rate Limits
**Problem**: Frequent API calls during file operations cause rate limit errors.

**Solution**: Implemented debouncing and local-first approach with deferred sync.
```typescript
// Debounced file updates
gistUpdateTimers.set(
  timerKey,
  setTimeout(async () => {
    // Update GitHub gist
  }, GIST_UPDATE_DEBOUNCE_MS),
);
```

#### Challenge 3: Cross-Platform Path Handling
**Problem**: Different path formats across operating systems.

**Solution**: Use VSCode's Uri API and path utilities.
```typescript
const fileUri = vscode.Uri.joinPath(parentDir, newFileName);
const relativePath = path.relative(scratchRoot.fsPath, uri.fsPath);
```

## 🌐 Web Application

### Architecture Overview

#### Next.js Structure
```
pages/
├── api/
│   ├── auth/
│   │   └── [...nextauth].ts    # NextAuth configuration
│   └── github/
│       └── gists.ts            # GitHub API proxy
├── _app.tsx                    # App wrapper
├── index.tsx                   # Home page
├── gists/
│   ├── [id].tsx               # Individual gist view
│   └── index.tsx              # Gist listing
└── new.tsx                    # Create new gist
```

#### Key Features

**Authentication Flow**
- GitHub OAuth via NextAuth.js
- Session management with secure cookies
- Token refresh and revocation

**Gist Management**
- Create, read, update, delete gists
- Real-time synchronization
- Rich markdown editor
- File upload support

**User Experience**
- Responsive design for all devices
- Offline support with service workers
- Progressive web app capabilities

### Implementation Details

#### Authentication Strategy
```typescript
// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: 'read:user gist',
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Store GitHub access token
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};
```

**Rationale**: NextAuth.js provides secure, production-ready authentication with built-in session management and security features.

#### API Integration
```typescript
// GitHub API proxy to avoid CORS issues
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Proxy request to GitHub API
  const response = await fetch('https://api.github.com/gists', {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}
```

**Rationale**: API proxy prevents exposing tokens client-side and handles CORS issues.

#### State Management
```typescript
// React Query for server state
const { data: gists, isLoading } = useQuery({
  queryKey: ['gists'],
  queryFn: fetchGists,
  staleTime: 5 * 60 * 1000, // 5 minutes
  refetchInterval: 30 * 60 * 1000, // 30 minutes
});
```

**Rationale**: React Query provides efficient caching, background updates, and optimistic updates.

### Performance Optimizations

#### Code Splitting
```typescript
// Dynamic imports for large components
const MarkdownEditor = dynamic(() => import('../components/MarkdownEditor'), {
  loading: () => <div>Loading editor...</div>,
});
```

#### Image Optimization
```typescript
// Next.js Image component for optimization
<Image
  src={gist.avatar}
  alt={gist.owner}
  width={40}
  height={40}
  className="rounded-full"
/>
```

#### Caching Strategy
- **Static Generation**: For static content
- **Incremental Static Regeneration**: For frequently changing content
- **Client-side Caching**: For user-specific data

## 📱 Mobile Application

### Architecture Overview

#### React Native Structure
```
src/
├── components/
│   ├── GistEditor.tsx      # Markdown editor
│   ├── GistList.tsx        # Gist listing
│   └── AuthButton.tsx      # Authentication
├── hooks/
│   ├── useAuth.ts          # Authentication state
│   ├── useGists.ts         # Gist data
│   └── useSync.ts          # Sync logic
├── navigation/
│   └── AppNavigator.tsx    # Navigation structure
├── services/
│   ├── api.ts              # API client
│   ├── storage.ts          # Local storage
│   └── sync.ts             # Sync service
└── utils/
    ├── markdown.ts         # Markdown utilities
    └── platform.ts         # Platform-specific code
```

### Key Features

**Cross-Platform Compatibility**
- iOS and Android support
- Platform-specific UI adaptations
- Native performance optimizations

**Offline Support**
- Local SQLite database
- Conflict resolution strategies
- Background synchronization

**Native Integrations**
- File system access
- Share extensions
- Push notifications

### Implementation Decisions

#### Navigation Strategy
```typescript
// React Navigation with tab and stack navigators
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Gists" component={GistStack} />
        <Tab.Screen name="Editor" component={EditorStack} />
        <Tab.Screen name="Settings" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

**Rationale**: Tab navigation for main sections, stack navigation for detailed flows.

#### State Management
```typescript
// Zustand for simple, performant state management
interface AppState {
  user: User | null;
  gists: Gist[];
  isLoading: boolean;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  gists: [],
  isLoading: false,
  setUser: (user) => set({ user }),
  setGists: (gists) => set({ gists }),
}));
```

**Rationale**: Zustand provides simple, performant state management without boilerplate.

#### Local Storage
```typescript
// SQLite for local data persistence
import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase({
  name: 'scratchpad.db',
  location: 'default',
});

// Store gists locally for offline access
export const storeGistLocally = async (gist: Gist) => {
  await db.executeSql(
    'INSERT OR REPLACE INTO gists (id, data, updated_at) VALUES (?, ?, ?)',
    [gist.id, JSON.stringify(gist), new Date().toISOString()]
  );
};
```

**Rationale**: SQLite provides robust local storage with good performance and reliability.

## 🔄 Shared Components

### Cross-Platform Utilities

#### TypeScript Types
```typescript
// Shared types across all platforms
export interface Gist {
  id: string;
  description: string | null;
  files: GistFile[];
  owner: GistOwner;
  created_at: string;
  updated_at: string;
  public: boolean;
}

export interface GistFile {
  filename: string;
  content: string;
  language: string;
  size: number;
}
```

#### API Client
```typescript
// Platform-agnostic API client
export class GitHubApiClient {
  constructor(private accessToken: string) {}

  async getGists(): Promise<Gist[]> {
    // Implementation works across platforms
  }

  async createGist(gist: CreateGistRequest): Promise<Gist> {
    // Implementation works across platforms
  }
}
```

#### Markdown Processing
```typescript
// Shared markdown utilities
export const processMarkdown = (content: string): string => {
  // Platform-agnostic markdown processing
};

export const extractMarkdownMetadata = (content: string) => {
  // Extract frontmatter and metadata
};
```

## 📊 Data Models

### Core Entities

#### Gist Model
```typescript
interface Gist {
  id: string;                    // GitHub gist ID
  description: string | null;    // User description
  files: GistFile[];            // Array of files
  owner: {
    login: string;
    avatar_url: string;
  };
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
  public: boolean;              // Public/private status
}
```

#### Gist File Model
```typescript
interface GistFile {
  filename: string;             // File name
  content: string;              // File content
  language: string;            // File language
  size: number;                 // File size in bytes
  raw_url: string;             // Direct download URL
}
```

#### User Model
```typescript
interface User {
  id: string;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
  bio: string | null;
}
```

### Data Flow

#### Extension Data Flow
```
File System → Extension → GitHub API
     ↑              ↓              ↓
  Local Sync ← Tree View ← User Actions
```

#### Web App Data Flow
```
Browser → Next.js → API Routes → GitHub API
   ↑         ↓          ↓           ↓
UI State ← React Query ← Cache ← User Actions
```

#### Mobile App Data Flow
```
UI → State Manager → API Client → GitHub API
 ↑        ↓              ↓           ↓
SQLite ← Sync Service ← Background Sync ← File System
```

## 🔌 API Integration

### GitHub API Usage

#### Endpoints Used
```typescript
// Authentication
GET /user                          // Get user info
POST /login/oauth/access_token    // Exchange code for token

// Gist Operations
GET /gists                        // List user gists
GET /gists/{id}                   // Get specific gist
POST /gists                       // Create new gist
PATCH /gists/{id}                 // Update gist
DELETE /gists/{id}                // Delete gist
```

#### Rate Limiting Strategy
```typescript
// Rate limit aware API client
class RateLimitedGitHubClient {
  private lastRequest = 0;
  private minInterval = 1000; // 1 second between requests

  async makeRequest(endpoint: string, options?: RequestInit) {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      await delay(this.minInterval - timeSinceLastRequest);
    }
    
    this.lastRequest = Date.now();
    return this.fetch(endpoint, options);
  }
}
```

#### Error Handling
```typescript
// Comprehensive error handling
interface ApiError {
  message: string;
  status: number;
  type: 'rate_limit' | 'auth' | 'network' | 'server';
}

const handleApiError = (error: ApiError) => {
  switch (error.type) {
    case 'rate_limit':
      return 'GitHub API rate limit exceeded. Please try again later.';
    case 'auth':
      return 'Authentication failed. Please sign in again.';
    case 'network':
      return 'Network error. Please check your connection.';
    default:
      return 'An unexpected error occurred.';
  }
};
```

## ⚡ Performance Optimizations

### Extension Optimizations

#### Debounced File Operations
```typescript
// Prevent excessive API calls during rapid file changes
const debouncedUpdate = debounce(
  (gistId: string, content: string) => updateGist(gistId, content),
  5000 // 5 seconds
);
```

#### Efficient Tree View Updates
```typescript
// Only refresh changed items
const refreshTreeItem = (item: GistTreeItem) => {
  this._onDidChangeTreeData.fire(item);
};
```

#### Memory Management
```typescript
// Clean up resources on deactivation
export function deactivate() {
  disposeWatchers();
  clearAllTimers();
}
```

### Web App Optimizations

#### Code Splitting
```typescript
// Load components on demand
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

#### Image Optimization
```typescript
// Optimize images with Next.js
<Image
  src={imageUrl}
  alt={alt}
  width={width}
  height={height}
  priority={isAboveFold}
/>
```

#### Caching Strategy
```typescript
// React Query for efficient caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

### Mobile Optimizations

#### List Virtualization
```typescript
// Efficient large list rendering
<FlatList
  data={gists}
  renderItem={renderGist}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

#### Background Sync
```typescript
// Sync in background without blocking UI
BackgroundSync.registerTask({
  name: 'sync-gists',
  interval: 30 * 60 * 1000, // 30 minutes
  task: async () => {
    await syncGists();
  },
});
```

## 🔒 Security Considerations

### Authentication Security

#### Token Management
```typescript
// Secure token storage
const storeToken = async (token: string) => {
  await SecureStore.setItemAsync('github_token', token);
};

// Token rotation
const refreshToken = async () => {
  const newToken = await refreshGitHubToken();
  await storeToken(newToken);
  return newToken;
};
```

#### OAuth Implementation
```typescript
// Secure OAuth flow
const authConfig = {
  clientId: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  scope: 'read:user gist',
  redirectUri: 'scratchpad://auth',
};
```

### Data Security

#### Input Validation
```typescript
// Validate all user inputs
const validateGistContent = (content: string): boolean => {
  const maxLength = 1000000; // 1MB limit
  return content.length <= maxLength && !containsMaliciousContent(content);
};
```

#### API Security
```typescript
// Rate limiting on API routes
export default withRateLimit(
  async (req: NextApiRequest, res: NextApiResponse) => {
    // API logic
  },
  { max: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
);
```

## 🚀 Future Enhancements

### Planned Features

#### Collaboration Features
- Real-time collaborative editing
- Comment threads on gists
- Share links with permissions
- Team workspace support

#### Advanced Editor Features
- Rich text editing mode
- Code syntax highlighting
- File attachments
- Version history visualization

#### Mobile Enhancements
- Offline-first architecture
- Push notifications for gist updates
- Widget support
- Apple Watch/Android Wear apps

#### Integration Features
- VS Code workspace integration
- GitHub Actions integration
- Third-party service connections
- Plugin system

### Technical Improvements

#### Performance
- Implement GraphQL for efficient data fetching
- Add service workers for offline support
- Optimize bundle sizes with tree shaking
- Implement edge caching

#### Architecture
- Microservices architecture for scalability
- Event-driven architecture for real-time updates
- Database sharding for large datasets
- CDN integration for global performance

#### Developer Experience
- Comprehensive test suite
- Automated CI/CD pipelines
- Performance monitoring
- Error tracking and analytics

### Research Areas

#### Alternative Storage
- Evaluate self-hosted storage options
- Consider blockchain-based storage
- Research decentralized alternatives
- Implement data portability features

#### AI Integration
- AI-powered content suggestions
- Automatic categorization
- Smart search capabilities
- Content summarization

#### Accessibility
- Comprehensive a11y testing
- Screen reader optimization
- Keyboard navigation
- High contrast themes

## 📝 Implementation Timeline

### Phase 1: Foundation (Current)
- [x] VSCode extension core functionality
- [x] Basic web application
- [x] GitHub API integration
- [x] Authentication system

### Phase 2: Enhancement (Next 3 months)
- [ ] Mobile application beta
- [ ] Advanced editor features
- [ ] Performance optimizations
- [ ] Comprehensive testing

### Phase 3: Collaboration (3-6 months)
- [ ] Real-time collaboration
- [ ] Team features
- [ ] Advanced sharing
- [ ] Integration ecosystem

### Phase 4: Scale (6-12 months)
- [ ] Enterprise features
- [ ] Advanced security
- [ ] Global deployment
- [ ] API platform

This document serves as a living reference for the Scratchpad project's technical implementation and will be updated as the project evolves.
