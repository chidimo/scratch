// Extension constants and default values

export const EXTENSION_ID = 'scratch';
export const VIEW_ID = 'scratch.gistsView';
export const VIEW_FLAT_ID = 'scratch.gistsFlatView';

// GitHub authentication
export const GITHUB_PROVIDER_ID = 'github';
export const DEFAULT_GITHUB_SCOPES = ['read:user', 'gist'];

// Timing constants (in milliseconds)
export const GIST_UPDATE_DEBOUNCE_MS = 5 * 1_000;
export const TREE_REFRESH_DELAY_MS = 100;
export const CONTEXT_UPDATE_DELAY_MS = 100;
export const TREE_VIEW_COMMAND_DELAY_MS = 200;

// Default configuration values
export const DEFAULT_CONFIG = {
  storagePath: '~/.scratch',
  scratchFolderName: '.scratch',
  autoCreateScratchFolder: true,
  watchScratchFolder: true,
  userIdStrategy: 'git' as const,
  gistAutoRefreshMinutes: 15, // Refresh every 15 minutes
} as const;

// GitHub API limits
export const GITHUB_API_RATE_LIMITS = {
  unauthenticated: 60, // requests per hour
  authenticated: 5000, // requests per hour
} as const;

// File system constants
export const MARKDOWN_EXTENSIONS = ['.md', '.markdown'];

// UI messages
export const MESSAGES = {
  noFileOpen: 'No file is currently open.',
  notScratchNote: 'This file is not a Scratch note.',
  couldNotDetermineGistId: 'Could not determine gist ID.',
  nameRequired: 'Name is required.',
  localDeleteSuccess:
    'Note deleted locally. GitHub sync will happen during next refresh to avoid rate limits.',
  localRenameSuccess:
    'Note renamed locally. GitHub sync will happen during next refresh to avoid rate limits.',
  rateLimitExceeded: 'GitHub API rate limit exceeded. Please try again later.',
  githubUpdateFailed:
    'GitHub update failed - changes may be restored on next sync.',
} as const;
