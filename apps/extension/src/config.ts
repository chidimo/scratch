// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import { ScratchConfig, UserIdStrategy } from './types';
import { EXTENSION_ID } from './constants';

function resolveStoragePath(rawPath: string | undefined): string {
  if (!rawPath) {
    return path.join(os.homedir(), 'scratch');
  }

  if (rawPath.startsWith('~')) {
    const relativePath = rawPath.slice(1).replace(/^[/\\]+/, '');
    return path.join(os.homedir(), relativePath);
  }

  return rawPath;
}

export function getScratchConfig(): ScratchConfig {
  const config = vscode.workspace.getConfiguration(EXTENSION_ID);

  return {
    storagePath: resolveStoragePath(config.get<string>('storagePath')),
    autoCreateScratchFolder: config.get<boolean>(
      'autoCreateScratchFolder',
      true,
    ),
    watchScratchFolder: config.get<boolean>('watchScratchFolder', true),
    userIdStrategy: config.get<UserIdStrategy>('userIdStrategy', 'git'),
    gistAutoRefreshMinutes: config.get<number>('gistAutoRefreshMinutes', 0),
  };
}
