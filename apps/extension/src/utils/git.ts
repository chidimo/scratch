// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GitUserIdentity } from '../types';

const execFileAsync = promisify(execFile);

async function getGitConfigValue(
  cwd: string,
  key: string,
): Promise<string | undefined> {
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', key], {
      cwd,
    });

    const value = stdout.trim();
    return value.length > 0 ? value : undefined;
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(`Failed to get Git config value: ${key}`);
    return undefined;
  }
}

export async function getGitUserIdentity(
  cwd: string,
): Promise<GitUserIdentity | null> {
  const [name, email] = await Promise.all([
    getGitConfigValue(cwd, 'user.name'),
    getGitConfigValue(cwd, 'user.email'),
  ]);

  if (!name && !email) {
    return null;
  }

  return {
    name,
    email,
    source: 'git',
  };
}
