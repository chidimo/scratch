// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as path from 'node:path';
import { ScratchConfig } from '../types';
import { getScratchConfig } from '../config';
import { getGithubSession } from '../auth/github';

export function getScratchRoot(config: ScratchConfig): vscode.Uri {
  return vscode.Uri.file(config.storagePath);
}

function getGistsRoot(config: ScratchConfig): vscode.Uri {
  return getScratchRoot(config);
}

async function ensureScratchRoot(config: ScratchConfig): Promise<vscode.Uri> {
  const root = getScratchRoot(config);
  await vscode.workspace.fs.createDirectory(root);
  return root;
}

export async function getScratchContext(): Promise<{
  config: ReturnType<typeof getScratchConfig>;
  scratchRoot: vscode.Uri;
  gistsRoot: vscode.Uri;
}> {
  const config = getScratchConfig();
  const gistsRoot = getGistsRoot(config);
  const scratchRoot = await ensureScratchRoot(config);
  return { config, scratchRoot, gistsRoot };
}

export function createScratchWatcher(
  config: ScratchConfig,
): vscode.FileSystemWatcher {
  const pattern = new vscode.RelativePattern(
    getScratchRoot(config),
    '**/*',
  );

  return vscode.workspace.createFileSystemWatcher(pattern);
}

export function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown');
}

export function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

export async function listMarkdownFiles(
  root: vscode.Uri,
): Promise<{ relativePath: string; uri: vscode.Uri }[]> {
  const entries = await vscode.workspace.fs.readDirectory(root);
  const results: { relativePath: string; uri: vscode.Uri }[] = [];

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(root, name);
    if (type === vscode.FileType.Directory) {
      const nested = await listMarkdownFiles(entryUri);
      results.push(
        ...nested.map((item) => ({
          relativePath: `${name}/${item.relativePath}`,
          uri: item.uri,
        })),
      );
    } else if (type === vscode.FileType.File && isMarkdownFile(name)) {
      results.push({ relativePath: name, uri: entryUri });
    }
  }

  return results;
}

export async function collectExistingNoteNames(
  config: ReturnType<typeof getScratchConfig>,
): Promise<Set<string>> {
  const gistsRoot = getGistsRoot(config);
  const markdownFiles = await listMarkdownFiles(gistsRoot);
  const names = new Set<string>();

  for (const file of markdownFiles) {
    const baseName = path.posix.basename(file.relativePath).toLowerCase();
    names.add(baseName);
  }

  return names;
}

export function buildNoteTitleValidator(
  existingNoteNames: Set<string>,
): (value: string) => string | undefined {
  return (value: string) => {
    const trimmed = value.trim();
    if (!trimmed.length) {
      return 'Title is required.';
    }
    const filename = `${trimmed}.md`.toLowerCase();
    if (existingNoteNames.has(filename)) {
      return 'A note with this name already exists.';
    }
    return undefined;
  };
}

export async function removeStaleMarkdownFiles(
  gistFolder: vscode.Uri,
  remoteMarkdownPaths: Set<string>,
): Promise<void> {
  const localMarkdownFiles = await listMarkdownFiles(gistFolder);

  for (const local of localMarkdownFiles) {
    if (!remoteMarkdownPaths.has(normalizePath(local.relativePath))) {
      await vscode.workspace.fs.delete(local.uri, { useTrash: true });
    }
  }
}

export async function removeEmptyGistFolder(
  gistsRoot: vscode.Uri,
  fileUri: vscode.Uri,
  outputChannel?: vscode.OutputChannel,
): Promise<void> {
  const relativePath = path.relative(gistsRoot.fsPath, fileUri.fsPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return;
  }

  const segments = relativePath.split(path.sep).filter(Boolean);
  if (segments.length < 2) {
    return;
  }

  const gistId = segments[0];
  const gistFolder = vscode.Uri.joinPath(gistsRoot, gistId);

  try {
    const entries = await vscode.workspace.fs.readDirectory(gistFolder);
    if (!entries.length) {
      await vscode.workspace.fs.delete(gistFolder, { useTrash: true });
      outputChannel?.appendLine(`Removed empty gist folder ${gistId}.`);
    }
  } catch (error) {
    outputChannel?.appendLine(
      `Failed to remove empty gist folder ${gistId}: ${String(error)}`,
    );
  }
}

export function getGistInfoFromUri(
  scratchRoot: vscode.Uri,
  fileUri: vscode.Uri,
): { gistId: string; filePath: string } | undefined {
  const relativePath = path.relative(scratchRoot.fsPath, fileUri.fsPath);
  const segments = relativePath.split(path.sep);
  if (segments.length < 2) {
    return undefined;
  }

  const gistId = segments[0];
  const fileSegments = segments.slice(1);
  if (!gistId || fileSegments.length === 0) {
    return undefined;
  }

  const filePath = fileSegments.join('/');
  return { gistId, filePath };
}

export async function ensureGithubSession(
  scratchSignedIn: boolean,
  action: string,
): Promise<vscode.AuthenticationSession | undefined> {
  if (!scratchSignedIn) {
    vscode.window.showWarningMessage(
      `Scratchpad: GitHub sign-in required to ${action}.`,
    );
    return undefined;
  }

  const session = await getGithubSession(true);

  if (!session) {
    vscode.window.showWarningMessage(
      `Scratchpad: GitHub sign-in required to ${action}.`,
    );
    return undefined;
  }

  return session;
}
