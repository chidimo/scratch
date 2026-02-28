// eslint-disable-next-line import/no-unresolved
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { EXTENSION_ID } from './constants';
import { ScratchConfig, UserIdStrategy } from './types';

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
    accentColor: config.get<string>('accentColor', 'testing.iconPassed'),
    groupTodosByFile: config.get<boolean>('groupTodosByFile', true),
  };
}
