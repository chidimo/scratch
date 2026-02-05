import * as path from 'node:path';
import * as vscode from 'vscode';
import { getGithubSession, signInGithub, signOutGithub } from './auth/github';
import { getScratchConfig } from './config';
import {
  createGist,
  fetchGist,
  GistSummary,
  listGists,
  updateGistFile,
} from './services/gist-sync';
import { getGitUserIdentity } from './utils/git';
import {
  createScratchWatcher,
  ensureScratchRoot,
  getGistsRoot,
} from './utils/scratch';
import { hasWorkspaceFolders } from './utils/workspace';
import { GistTreeProvider } from './views/gist-tree';

let watchers: vscode.FileSystemWatcher[] = [];
const gistUpdateTimers = new Map<string, NodeJS.Timeout>();
const GIST_UPDATE_DEBOUNCE_MS = 2000;
const gistIdCache = new Set<string>();
const gistDeleteTimers = new Map<string, NodeJS.Timeout>();
let lastGistRefreshAt: Date | null = null;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('Scratch');
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  const gistTreeProvider = new GistTreeProvider();
  hydrateGistIdCache(context);
  const disposables: vscode.Disposable[] = [
    outputChannel,
    statusBar,
    vscode.window.registerTreeDataProvider(
      'scratch.gistsView',
      gistTreeProvider,
    ),
    vscode.commands.registerCommand(
      'scratch.refreshScratchState',
      refreshScratchState,
    ),
    vscode.commands.registerCommand(
      'scratch.createScratchFolder',
      refreshScratchState,
    ),
    vscode.commands.registerCommand(
      'scratch.showUserIdentity',
      showUserIdentity,
    ),
    vscode.commands.registerCommand(
      'scratch.showGithubStatus',
      showGithubStatus,
    ),
    vscode.commands.registerCommand('scratch.signInGithub', handleGithubSignIn),
    vscode.commands.registerCommand(
      'scratch.signOutGithub',
      handleGithubSignOut,
    ),
    vscode.commands.registerCommand('scratch.syncGists', handleGistSync),
    vscode.commands.registerCommand('scratch.refreshGists', handleGistRefresh),
    vscode.commands.registerCommand('scratch.createNote', handleCreateNote),
    vscode.commands.registerCommand('scratch.deleteNote', handleDeleteNote),
    vscode.commands.registerCommand('scratch.renameNote', handleRenameNote),
    vscode.commands.registerCommand('scratch.openScratchFolder', async () => {
      const config = getScratchConfig();
      const scratchRoot = await ensureScratchRoot(config);
      await vscode.commands.executeCommand('revealInExplorer', scratchRoot);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('scratch')) {
        refreshScratchState().catch((error) => {
          outputChannel.appendLine(
            `Failed to refresh scratch state: ${String(error)}`,
          );
        });
        scheduleAutoRefresh();
      }
    }),
    vscode.authentication.onDidChangeSessions(async (event) => {
      if (event.provider.id === 'github') {
        await updateStatusBar();
      }
    }),
  ];

  async function refreshScratchState(): Promise<void> {
    const config = getScratchConfig();
    const scratchRoot = await ensureScratchRoot(config);
    outputChannel.appendLine(`Scratch folder ready: ${scratchRoot.fsPath}`);
    resetWatchers(config, outputChannel, scratchRoot);
    gistTreeProvider.refresh();
  }

  async function showUserIdentity(): Promise<void> {
    const config = getScratchConfig();

    if (!hasWorkspaceFolders()) {
      vscode.window.showWarningMessage(
        'Scratchpad: open a workspace to detect user identity.',
      );
      return;
    }

    if (config.userIdStrategy !== 'git') {
      vscode.window.showErrorMessage(
        `Scratchpad: unsupported userIdStrategy "${config.userIdStrategy}".`,
      );
      return;
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const identity = await getGitUserIdentity(workspaceFolder.uri.fsPath);
    if (!identity) {
      vscode.window.showWarningMessage(
        'Scratchpad: Git user identity not configured.',
      );
      return;
    }

    const display = [
      identity.name ? `Name: ${identity.name}` : null,
      identity.email ? `Email: ${identity.email}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    vscode.window.showInformationMessage(
      `Scratchpad user (${identity.source}): ${display}`,
    );
  }

  async function showGithubStatus(): Promise<void> {
    try {
      const session = await getGithubSession(false);

      if (!session) {
        vscode.window.showWarningMessage(
          'Scratchpad: no GitHub session found. Run Scratch: Sign In to GitHub.',
        );
        return;
      }

      vscode.window.showInformationMessage(
        `Scratchpad: GitHub session active for ${session.account.label}.`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to read GitHub session. ${String(error)}`,
      );
    }
  }

  async function handleGistSync(): Promise<void> {
    try {
      const session = await getGithubSession(true);

      if (!session) {
        vscode.window.showWarningMessage(
          'Scratchpad: GitHub sign-in required to sync gists.',
        );
        return;
      }

      const config = getScratchConfig();
      await ensureScratchRoot(config);

      statusBar.text = '$(sync~spin) Scratch: Loading gists...';
      statusBar.command = 'scratch.showGithubStatus';
      outputChannel.appendLine('Scratchpad: fetching gist list...');

      const selectedGists = await pickMarkdownGists(session.accessToken);
      if (!selectedGists?.length) {
        return;
      }

      updateGistIdCache(
        context,
        selectedGists.map((gist) => gist.id),
      );

      const encoder = new TextEncoder();
      const root = getGistsRoot(config);

      for (const gist of selectedGists) {
        const gistDetail = await fetchGist(session.accessToken, gist.id);
        const gistFolder = vscode.Uri.joinPath(root, gistDetail.id);
        await vscode.workspace.fs.createDirectory(gistFolder);

        const markdownFiles = gistDetail.files.filter((file) =>
          isMarkdownFile(file.filename),
        );

        if (!markdownFiles.length) {
          continue;
        }

        for (const file of markdownFiles) {
          const fileUri = vscode.Uri.joinPath(gistFolder, file.filename);
          await vscode.workspace.fs.writeFile(
            fileUri,
            encoder.encode(file.content),
          );
        }

        outputChannel.appendLine(
          `Imported gist ${gistDetail.id} (${markdownFiles.length} markdown files)`,
        );
      }

      vscode.window.showInformationMessage(
        `Scratchpad: imported ${selectedGists.length} gist(s) into ${root.fsPath}.`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist sync failed. ${String(error)}`,
      );
    } finally {
      gistTreeProvider.refresh();
      await updateStatusBar();
    }
  }

  async function handleGistRefresh(): Promise<void> {
    try {
      const session = await getGithubSession(true);

      if (!session) {
        vscode.window.showWarningMessage(
          'Scratchpad: GitHub sign-in required to refresh gists.',
        );
        return;
      }

      const config = getScratchConfig();
      await ensureScratchRoot(config);
      const root = getGistsRoot(config);
      const entries = await vscode.workspace.fs.readDirectory(root);
      const gistIds = entries
        .filter(([, type]) => type === vscode.FileType.Directory)
        .map(([name]) => name);

      if (!gistIds.length) {
        vscode.window.showInformationMessage(
          'Scratchpad: no imported gists found.',
        );
        return;
      }

      updateGistIdCache(context, gistIds);

      statusBar.text = '$(sync~spin) Scratch: Refreshing gists...';
      statusBar.command = 'scratch.showGithubStatus';
      outputChannel.appendLine('Scratchpad: refreshing gists from GitHub...');

      const encoder = new TextEncoder();

      for (const gistId of gistIds) {
        const gistDetail = await fetchGist(session.accessToken, gistId);
        const gistFolder = vscode.Uri.joinPath(root, gistDetail.id);
        await vscode.workspace.fs.createDirectory(gistFolder);

        const markdownFiles = gistDetail.files.filter((file) =>
          isMarkdownFile(file.filename),
        );
        const remoteMarkdownPaths = new Set(
          markdownFiles.map((file) => normalizePath(file.filename)),
        );

        for (const file of markdownFiles) {
          const fileUri = vscode.Uri.joinPath(gistFolder, file.filename);
          await vscode.workspace.fs.writeFile(
            fileUri,
            encoder.encode(file.content),
          );
        }

        await removeStaleMarkdownFiles(gistFolder, remoteMarkdownPaths);
      }

      lastGistRefreshAt = new Date();
      vscode.window.showInformationMessage(
        `Scratchpad: refreshed ${gistIds.length} gist(s).`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist refresh failed. ${String(error)}`,
      );
    } finally {
      gistTreeProvider.refresh();
      await updateStatusBar();
    }
  }

  let gistRefreshInterval: NodeJS.Timeout | undefined;

  function scheduleAutoRefresh(): void {
    if (gistRefreshInterval) {
      clearInterval(gistRefreshInterval);
      gistRefreshInterval = undefined;
    }

    const config = getScratchConfig();
    const minutes = config.gistAutoRefreshMinutes;
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return;
    }

    gistRefreshInterval = setInterval(
      async () => {
        await handleGistRefresh();
      },
      minutes * 60 * 1000,
    );
  }

  async function pickMarkdownGists(
    accessToken: string,
  ): Promise<GistSummary[] | undefined> {
    const summaries = await listGists(accessToken);

    if (!summaries.length) {
      vscode.window.showInformationMessage('Scratchpad: no gists found.');
      return undefined;
    }

    const markdownGists = summaries.filter((gist) =>
      gist.fileNames.some(isMarkdownFile),
    );

    if (!markdownGists.length) {
      vscode.window.showInformationMessage(
        'Scratchpad: no markdown gists found.',
      );
      return undefined;
    }

    type GistChoice =
      | { type: 'all'; label: string; description: string }
      | {
          type: 'gist';
          label: string;
          description: string;
          detail?: string;
          gist: GistSummary;
        };

    const gistChoices: GistChoice[] = [
      {
        type: 'all',
        label: 'Import all markdown gists',
        description: `${markdownGists.length} gists`,
      },
      ...markdownGists.map((gist) => ({
        type: 'gist' as const,
        label: gist.description?.trim() || 'Untitled gist',
        description: `${gist.fileCount} files`,
        detail: gist.htmlUrl,
        gist,
      })),
    ];

    const selections = await vscode.window.showQuickPick(gistChoices, {
      canPickMany: true,
      placeHolder: 'Select markdown gists to import into Scratch',
    });

    if (!selections || selections.length === 0) {
      return undefined;
    }

    const includeAll = selections.some((selection) => selection.type === 'all');

    if (includeAll) {
      return markdownGists;
    }

    return selections
      .filter(
        (selection): selection is Extract<GistChoice, { type: 'gist' }> =>
          selection.type === 'gist',
      )
      .map((selection) => selection.gist);
  }

  async function handleCreateNote(): Promise<void> {
    try {
      const session = await getGithubSession(true);

      if (!session) {
        vscode.window.showWarningMessage(
          'Scratchpad: GitHub sign-in required to create notes.',
        );
        return;
      }

      const title = await vscode.window.showInputBox({
        prompt: 'Enter a title for the new note',
        placeHolder: 'Untitled note',
        validateInput: (value) =>
          value.trim().length ? undefined : 'Title is required.',
      });

      if (!title) {
        return;
      }

      const trimmedTitle = title.trim();
      const filename = `${trimmedTitle}.md`;

      const config = getScratchConfig();
      await ensureScratchRoot(config);

      statusBar.text = '$(sync~spin) Scratch: Creating note...';
      statusBar.command = 'scratch.showGithubStatus';

      const created = await createGist(session.accessToken, {
        description: trimmedTitle,
        files: {
          [filename]: '# ' + trimmedTitle + '\n\n',
        },
        isPublic: false,
      });

      if (!created.id) {
        vscode.window.showErrorMessage(
          'Scratchpad: failed to create gist for new note.',
        );
        return;
      }

      updateGistIdCache(context, [created.id]);

      const encoder = new TextEncoder();
      const gistsRoot = getGistsRoot(config);

      const gistFolder = vscode.Uri.joinPath(gistsRoot, created.id);
      await vscode.workspace.fs.createDirectory(gistFolder);

      const fileUri = vscode.Uri.joinPath(gistFolder, filename);
      await vscode.workspace.fs.writeFile(
        fileUri,
        encoder.encode('# ' + trimmedTitle + '\n\n'),
      );

      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, { preview: false });

      outputChannel.appendLine(
        `Created new note gist ${created.id} (${filename}).`,
      );
      vscode.window.showInformationMessage(
        'Scratchpad: new note created and opened.',
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to create note. ${String(error)}`,
      );
    } finally {
      gistTreeProvider.refresh();
      await updateStatusBar();
    }
  }

  async function handleDeleteNote(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No file is currently open.');
        return;
      }

      const fileUri = editor.document.uri;
      const config = getScratchConfig();
      const gistsRoot = getGistsRoot(config);

      // Check if the file is within the gists directory
      if (!fileUri.fsPath.includes(gistsRoot.fsPath)) {
        vscode.window.showWarningMessage('This file is not a Scratch note.');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        'Are you sure you want to delete this note?',
        { modal: true },
        'Delete',
      );

      if (confirmation !== 'Delete') {
        return;
      }

      // Delete the file
      await vscode.workspace.fs.delete(fileUri);

      // Close the editor if it's still open
      await vscode.commands.executeCommand(
        'workbench.action.closeActiveEditor',
      );

      vscode.window.showInformationMessage('Note deleted successfully.');
      gistTreeProvider.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to delete note. ${String(error)}`,
      );
    }
  }

  async function handleRenameNote(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No file is currently open.');
        return;
      }

      const fileUri = editor.document.uri;
      const config = getScratchConfig();
      const gistsRoot = getGistsRoot(config);

      // Check if the file is within the gists directory
      if (!fileUri.fsPath.includes(gistsRoot.fsPath)) {
        vscode.window.showWarningMessage('This file is not a Scratch note.');
        return;
      }

      const currentName = path.basename(fileUri.fsPath, '.md');
      const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name for the note',
        value: currentName,
        validateInput: (value) =>
          value.trim().length ? undefined : 'Name is required.',
      });

      if (!newName || newName.trim() === currentName) {
        return;
      }

      const trimmedName = newName.trim();
      const newFileName = `${trimmedName}.md`;
      const parentDir = fileUri.with({ path: path.dirname(fileUri.path) });
      const newFileUri = vscode.Uri.joinPath(parentDir, newFileName);

      // Rename the file
      await vscode.workspace.fs.rename(fileUri, newFileUri);

      // Open the renamed file
      const document = await vscode.workspace.openTextDocument(newFileUri);
      await vscode.window.showTextDocument(document, { preview: false });

      vscode.window.showInformationMessage('Note renamed successfully.');
      gistTreeProvider.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to rename note. ${String(error)}`,
      );
    }
  }

  async function handleGithubSignIn(): Promise<void> {
    try {
      const sessionInfo = await signInGithub(context);
      vscode.window.showInformationMessage(
        `Scratchpad: GitHub signed in as ${sessionInfo.accountLabel}.`,
      );
      await updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: GitHub sign-in failed. ${String(error)}`,
      );
    }
  }

  async function handleGithubSignOut(): Promise<void> {
    try {
      await signOutGithub(context);
      vscode.window.showInformationMessage(
        'Scratchpad: GitHub token removed. Sign out from the Accounts menu to revoke access.',
      );
      await updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: GitHub sign-out failed. ${String(error)}`,
      );
    }
  }

  async function updateStatusBar(): Promise<void> {
    try {
      const session = await getGithubSession(false);

      if (!session) {
        statusBar.text = '$(github) Scratch: Sign in';
        statusBar.tooltip = 'Scratchpad: Sign in to GitHub';
        statusBar.command = 'scratch.signInGithub';
        return;
      }

      const lastRefreshLabel = lastGistRefreshAt
        ? `Last refresh: ${lastGistRefreshAt.toLocaleString()}`
        : 'Last refresh: never';
      statusBar.text = '$(refresh) Scratch: Refresh gists';
      statusBar.tooltip = `Scratchpad: Refresh gists (${session.account.label})\n${lastRefreshLabel}`;
      statusBar.command = 'scratch.refreshGists';
    } catch (error) {
      statusBar.text = '$(github) Scratch: Auth error';
      statusBar.tooltip = `Scratchpad: ${String(error)}`;
      statusBar.command = 'scratch.showGithubStatus';
    }
  }

  context.subscriptions.push(...disposables);

  await refreshScratchState();
  await updateStatusBar();
  scheduleAutoRefresh();
  statusBar.show();
  outputChannel.appendLine('Scratchpad extension activated.');
}

export function deactivate(): void {
  disposeWatchers();
}

function resetWatchers(
  config: ReturnType<typeof getScratchConfig>,
  outputChannel: vscode.OutputChannel,
  scratchRoot: vscode.Uri,
): void {
  disposeWatchers();

  if (!config.watchScratchFolder) {
    outputChannel.appendLine('Scratch folder watching disabled.');
    return;
  }

  watchers = [createScratchWatcher(config)];

  for (const watcher of watchers) {
    watcher.onDidCreate((uri) => {
      outputChannel.appendLine(`Scratch file created: ${uri.fsPath}`);
      void guardGistFolderMutation(uri, scratchRoot, outputChannel, 'create');
      scheduleGistUpdate({
        scratchRoot,
        fileUri: uri,
        outputChannel,
      });
    });
    watcher.onDidChange((uri) => {
      outputChannel.appendLine(`Scratch file updated: ${uri.fsPath}`);
      scheduleGistUpdate({
        scratchRoot,
        fileUri: uri,
        outputChannel,
      });
    });
    watcher.onDidDelete((uri) => {
      outputChannel.appendLine(`Scratch file deleted: ${uri.fsPath}`);
      void guardGistFolderMutation(uri, scratchRoot, outputChannel, 'delete');
      scheduleGistDelete({
        scratchRoot,
        fileUri: uri,
        outputChannel,
      });
    });
  }
}

function disposeWatchers(): void {
  for (const watcher of watchers) {
    watcher.dispose();
  }
  watchers = [];
}

function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown');
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

async function listMarkdownFiles(
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

async function removeStaleMarkdownFiles(
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

function getGistInfoFromUri(
  scratchRoot: vscode.Uri,
  fileUri: vscode.Uri,
): { gistId: string; filePath: string } | undefined {
  const relativePath = path.relative(scratchRoot.fsPath, fileUri.fsPath);
  const segments = relativePath.split(path.sep);
  const gistsIndex = segments.indexOf('gists');

  if (gistsIndex < 0 || gistsIndex + 2 > segments.length - 1) {
    return undefined;
  }

  const gistId = segments[gistsIndex + 1];
  const fileSegments = segments.slice(gistsIndex + 2);
  if (!gistId || fileSegments.length === 0) {
    return undefined;
  }

  const filePath = fileSegments.join('/');
  return { gistId, filePath };
}

function scheduleGistUpdate(options: {
  scratchRoot: vscode.Uri;
  fileUri: vscode.Uri;
  outputChannel: vscode.OutputChannel;
}): void {
  const gistInfo = getGistInfoFromUri(options.scratchRoot, options.fileUri);
  if (!gistInfo || !isMarkdownFile(gistInfo.filePath)) {
    return;
  }

  const timerKey = options.fileUri.fsPath;
  const existingTimer = gistUpdateTimers.get(timerKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  gistUpdateTimers.set(
    timerKey,
    setTimeout(async () => {
      gistUpdateTimers.delete(timerKey);
      const session = await getGithubSession(false);

      if (!session) {
        options.outputChannel.appendLine(
          `Skipped gist update (not signed in): ${options.fileUri.fsPath}`,
        );
        return;
      }

      try {
        const contents = await vscode.workspace.fs.readFile(options.fileUri);
        const content = Buffer.from(contents).toString('utf-8');

        await updateGistFile({
          accessToken: session.accessToken,
          gistId: gistInfo.gistId,
          filename: gistInfo.filePath,
          content,
        });

        options.outputChannel.appendLine(
          `Updated gist ${gistInfo.gistId} -> ${gistInfo.filePath}`,
        );
      } catch (error) {
        options.outputChannel.appendLine(
          `Failed to update gist ${gistInfo.gistId}: ${String(error)}`,
        );
      }
    }, GIST_UPDATE_DEBOUNCE_MS),
  );
}

function scheduleGistDelete(options: {
  scratchRoot: vscode.Uri;
  fileUri: vscode.Uri;
  outputChannel: vscode.OutputChannel;
}): void {
  const gistInfo = getGistInfoFromUri(options.scratchRoot, options.fileUri);
  if (!gistInfo || !isMarkdownFile(gistInfo.filePath)) {
    return;
  }

  const timerKey = options.fileUri.fsPath;
  const existingTimer = gistDeleteTimers.get(timerKey);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  gistDeleteTimers.set(
    timerKey,
    setTimeout(async () => {
      gistDeleteTimers.delete(timerKey);
      const session = await getGithubSession(false);

      if (!session) {
        options.outputChannel.appendLine(
          `Skipped gist delete (not signed in): ${options.fileUri.fsPath}`,
        );
        return;
      }

      try {
        await updateGistFile({
          accessToken: session.accessToken,
          gistId: gistInfo.gistId,
          filename: gistInfo.filePath,
          content: null,
        });

        options.outputChannel.appendLine(
          `Deleted gist file ${gistInfo.gistId} -> ${gistInfo.filePath}`,
        );
      } catch (error) {
        options.outputChannel.appendLine(
          `Failed to delete gist ${gistInfo.gistId}: ${String(error)}`,
        );
      }
    }, GIST_UPDATE_DEBOUNCE_MS),
  );
}

function hydrateGistIdCache(context: vscode.ExtensionContext): void {
  const stored = context.globalState.get<string[]>('scratch.gistIds', []);
  for (const id of stored) {
    gistIdCache.add(id);
  }
}

function updateGistIdCache(
  context: vscode.ExtensionContext,
  ids: string[],
): void {
  for (const id of ids) {
    gistIdCache.add(id);
  }
  void context.globalState.update('scratch.gistIds', Array.from(gistIdCache));
}

async function guardGistFolderMutation(
  uri: vscode.Uri,
  scratchRoot: vscode.Uri,
  outputChannel: vscode.OutputChannel,
  type: 'create' | 'delete',
): Promise<void> {
  const relativePath = path.relative(scratchRoot.fsPath, uri.fsPath);
  const segments = relativePath.split(path.sep);

  if (segments[0] !== 'gists' || segments.length < 2) {
    return;
  }

  const gistId = segments[1];
  if (!gistId || gistIdCache.has(gistId)) {
    return;
  }

  if (type === 'delete') {
    outputChannel.appendLine(
      `Gist folder removed (${gistId}). Re-run sync to restore.`,
    );
    return;
  }

  try {
    const stat = await vscode.workspace.fs.stat(uri);
    if ((stat.type & vscode.FileType.Directory) !== vscode.FileType.Directory) {
      return;
    }

    outputChannel.appendLine(
      `Blocked rename or creation of unknown gist folder: ${gistId}`,
    );
    await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
  } catch (error) {
    outputChannel.appendLine(
      `Failed to validate gist folder ${gistId}: ${String(error)}`,
    );
  }
}
