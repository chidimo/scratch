import * as vscode from 'vscode';

export interface GitUserIdentity {
  name?: string;
  email?: string;
  source: 'git';
}

export interface ScratchFolderInfo {
  workspaceFolder: vscode.WorkspaceFolder;
  scratchUri: vscode.Uri;
  exists: boolean;
}

export type UserIdStrategy = 'git';

export interface ScratchConfig {
  storagePath: string;
  scratchFolderName: string;
  autoCreateScratchFolder: boolean;
  watchScratchFolder: boolean;
  userIdStrategy: UserIdStrategy;
  gistAutoRefreshMinutes: number;
}
