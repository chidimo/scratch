export const EXTENSION_ID = 'scratch';
export const VIEW_FLAT_ID = `${EXTENSION_ID}.gistsFlatView`;
export const VIEW_WITH_GIST_ID = `${EXTENSION_ID}.gistsView`;
export const VIEW_TODOS_ID = `${EXTENSION_ID}.todosView`;

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
  storagePath: '~/scratch',
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

// Secret keys
export const SECRET_KEYS = {
  githubAccessToken: 'scratch.github.accessToken',
} as const;

// Command identifiers
export const COMMANDS = {
  refreshScratchState: `${EXTENSION_ID}.refreshScratchState`,
  createScratchFolder: `${EXTENSION_ID}.createScratchFolder`,
  showUserIdentity: `${EXTENSION_ID}.showUserIdentity`,
  showGithubStatus: `${EXTENSION_ID}.showGithubStatus`,
  signInGithub: `${EXTENSION_ID}.signInGithub`,
  signOutGithub: `${EXTENSION_ID}.signOutGithub`,
  syncGists: `${EXTENSION_ID}.syncGists`,
  refreshGists: `${EXTENSION_ID}.refreshGists`,
  refreshGistsInProgress: `${EXTENSION_ID}.refreshGistsInProgress`,
  createNote: `${EXTENSION_ID}.createNote`,
  deleteNote: `${EXTENSION_ID}.deleteNote`,
  renameNote: `${EXTENSION_ID}.renameNote`,
  addNoteToGist: `${EXTENSION_ID}.addNoteToGist`,
  deleteGist: `${EXTENSION_ID}.deleteGist`,
  openScratchFolder: `${EXTENSION_ID}.openScratchFolder`,
  openExtensionSettings: `${EXTENSION_ID}.openExtensionSettings`,
  openNoteInBrowser: `${EXTENSION_ID}.openNoteInBrowser`,
  openTodoLocation: `${EXTENSION_ID}.openTodoLocation`,
} as const;
