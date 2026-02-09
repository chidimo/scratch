// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as path from 'node:path';
import * as os from 'node:os';

import { getGithubSession, signInGithub, signOutGithub } from './auth/github';
import { getScratchConfig } from './config';
import {
  buildNoteTitleValidator,
  collectExistingNoteNames,
  createScratchWatcher,
  ensureGithubSession,
  getGistInfoFromUri,
  getScratchContext,
  isMarkdownFile,
  normalizePath,
  removeEmptyGistFolder,
  removeStaleMarkdownFiles,
} from './utils/scratch';
import { GistTreeProvider } from './views/gist-tree';

import {
  createGist,
  fetchGist,
  GistSummary,
  listGists,
  updateGistFile,
  updateGistFiles,
} from './services/gist-sync';
import { getGitUserIdentity } from './utils/git';

import {
  COMMANDS,
  GIST_UPDATE_DEBOUNCE_MS,
  GITHUB_PROVIDER_ID,
  MESSAGES,
  SECRET_KEYS,
  VIEW_FLAT_ID,
  VIEW_WITH_GIST_ID,
} from './constants';

const gistIdCache = new Set<string>();
const gistDeleteTimers = new Map<string, NodeJS.Timeout>();
let lastGistRefreshAt: Date | null = null;
let watchers: vscode.FileSystemWatcher[] = [];
const gistUpdateTimers = new Map<string, NodeJS.Timeout>();

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel('Scratch');
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100,
  );
  let scratchSignedIn = false;
  const updateScratchSignedIn = async (): Promise<void> => {
    scratchSignedIn = Boolean(
      await context.secrets.get(SECRET_KEYS.githubAccessToken),
    );
  };
  await updateScratchSignedIn();

  const gistTreeProvider = new GistTreeProvider({
    flat: false,
    isSignedIn: () => scratchSignedIn,
  });
  const gistFlatTreeProvider = new GistTreeProvider({
    flat: true,
    isSignedIn: () => scratchSignedIn,
  });
  hydrateGistIdCache(context);

  const gistView = vscode.window.createTreeView(VIEW_WITH_GIST_ID, {
    treeDataProvider: gistTreeProvider,
  });
  const gistFlatView = vscode.window.createTreeView(VIEW_FLAT_ID, {
    treeDataProvider: gistFlatTreeProvider,
  });

  const disposables: vscode.Disposable[] = [
    outputChannel,
    statusBar,
    gistView,
    gistFlatView,
    vscode.commands.registerCommand(
      COMMANDS.refreshScratchState,
      refreshScratchState,
    ),
    vscode.commands.registerCommand(
      COMMANDS.createScratchFolder,
      refreshScratchState,
    ),
    vscode.commands.registerCommand(
      COMMANDS.showUserIdentity,
      showUserIdentity,
    ),
    vscode.commands.registerCommand(
      COMMANDS.showGithubStatus,
      showGithubStatus,
    ),
    vscode.commands.registerCommand(COMMANDS.signInGithub, handleGithubSignIn),
    vscode.commands.registerCommand(
      COMMANDS.signOutGithub,
      handleGithubSignOut,
    ),
    vscode.commands.registerCommand(COMMANDS.syncGists, handleGistSync),
    vscode.commands.registerCommand(COMMANDS.refreshGists, handleGistRefresh),
    vscode.commands.registerCommand(
      COMMANDS.refreshGistsInProgress,
      handleGistRefresh,
    ),
    vscode.commands.registerCommand(COMMANDS.createNote, handleCreateNote),
    vscode.commands.registerCommand(COMMANDS.deleteNote, handleDeleteNote),
    vscode.commands.registerCommand(COMMANDS.renameNote, handleRenameNote),
    vscode.commands.registerCommand(
      COMMANDS.openNoteInBrowser,
      handleOpenNoteInBrowser,
    ),
    vscode.commands.registerCommand(
      COMMANDS.addNoteToGist,
      handleAddNoteToGist,
    ),
    vscode.commands.registerCommand(COMMANDS.deleteGist, handleDeleteGist),
    vscode.commands.registerCommand(COMMANDS.openScratchFolder, async () => {
      const { scratchRoot } = await getScratchContext();
      const inWorkspace = Boolean(
        vscode.workspace.getWorkspaceFolder(scratchRoot),
      );

      if (inWorkspace) {
        await vscode.commands.executeCommand('revealInExplorer', scratchRoot);
        return;
      }

      await vscode.commands.executeCommand('revealFileInOS', scratchRoot);
    }),
    vscode.commands.registerCommand(
      COMMANDS.openExtensionSettings,
      openExtensionSettings,
    ),
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
      if (event.provider.id === GITHUB_PROVIDER_ID) {
        await updateStatusBar();
      }
    }),
  ];

  await vscode.commands.executeCommand(
    'setContext',
    'scratch.isRefreshingGists',
    false,
  );

  async function refreshScratchState(): Promise<void> {
    const { config, scratchRoot } = await getScratchContext();
    outputChannel.appendLine(`Scratch folder ready: ${scratchRoot.fsPath}`);
    resetWatchers(config, outputChannel, scratchRoot);
    refreshGistViews();
  }

  function refreshGistViews(): void {
    gistTreeProvider.refresh();
    gistFlatTreeProvider.refresh();
  }

  async function showUserIdentity(): Promise<void> {
    const config = getScratchConfig();

    if (config.userIdStrategy !== 'git') {
      vscode.window.showErrorMessage(
        `Scratchpad: unsupported userIdStrategy "${config.userIdStrategy}".`,
      );
      return;
    }

    // Use workspace folder if available, otherwise use home directory for global git config
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const gitConfigPath = workspaceFolder
      ? workspaceFolder.uri.fsPath
      : os.homedir();

    const identity = await getGitUserIdentity(gitConfigPath);
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

    const source = workspaceFolder ? 'workspace' : 'global';
    vscode.window.showInformationMessage(
      `Scratchpad user (${source} ${identity.source}): ${display}`,
    );
  }

  async function showGithubStatus(): Promise<void> {
    try {
      if (!scratchSignedIn) {
        vscode.window.showWarningMessage(
          'Scratchpad: not signed in. Run Scratch (Gists): Sign In to GitHub.',
        );
        return;
      }

      const session = await getGithubSession(false);

      if (!session) {
        vscode.window.showWarningMessage(
          'Scratchpad: no GitHub session found. Run Scratch (Gists): Sign In to GitHub.',
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

  async function openExtensionSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      'Scratch (Gists)',
    );
  }

  async function handleGistSync(): Promise<void> {
    try {
      const session = await ensureGithubSession(scratchSignedIn, 'sync gists');
      if (!session) {
        return;
      }

      const { gistsRoot } = await getScratchContext();

      statusBar.text = '$(sync~spin) Scratch: Loading gists...';
      statusBar.command = COMMANDS.showGithubStatus;
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
      for (const gist of selectedGists) {
        const gistDetail = await fetchGist(session.accessToken, gist.id);
        const gistFolder = vscode.Uri.joinPath(gistsRoot, gistDetail.id);
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
        `Scratchpad: imported ${selectedGists.length} gist(s) into ${gistsRoot.fsPath}.`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist sync failed. ${String(error)}`,
      );
    } finally {
      refreshGistViews();
      await updateStatusBar();
    }
  }

  async function handleGistRefresh(): Promise<void> {
    try {
      await vscode.commands.executeCommand(
        'setContext',
        'scratch.isRefreshingGists',
        true,
      );

      const session = await ensureGithubSession(
        scratchSignedIn,
        'refresh gists',
      );
      if (!session) {
        return;
      }

      const { config, gistsRoot } = await getScratchContext();
      const entries = await vscode.workspace.fs.readDirectory(gistsRoot);
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
      statusBar.command = COMMANDS.showGithubStatus;
      outputChannel.appendLine('Scratchpad: refreshing gists from GitHub...');

      const encoder = new TextEncoder();

      for (const gistId of gistIds) {
        const gistDetail = await fetchGist(session.accessToken, gistId);
        const gistFolder = vscode.Uri.joinPath(gistsRoot, gistDetail.id);
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
      const refreshIntervalMinutes = config.gistAutoRefreshMinutes;
      vscode.window.showInformationMessage(
        `Scratchpad: refreshed ${gistIds.length} gist(s).\nRefresh interval: ${refreshIntervalMinutes} minutes`,
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist refresh failed. ${String(error)}`,
      );
    } finally {
      await vscode.commands.executeCommand(
        'setContext',
        'scratch.isRefreshingGists',
        false,
      );
      refreshGistViews();
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

    const { gistsRoot } = await getScratchContext();
    const importedIds = new Set<string>();

    try {
      const entries = await vscode.workspace.fs.readDirectory(gistsRoot);
      for (const [name, type] of entries) {
        if (type === vscode.FileType.Directory) {
          importedIds.add(name);
        }
      }
    } catch (error) {
      outputChannel.appendLine(
        `Failed to list imported gists: ${String(error)}`,
      );
    }

    const unimportedMarkdownGists = markdownGists.filter(
      (gist) => !importedIds.has(gist.id),
    );

    if (!unimportedMarkdownGists.length) {
      vscode.window.showInformationMessage(
        'Scratchpad: all markdown gists are already imported.',
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
        description: `${unimportedMarkdownGists.length} gists`,
      },
      ...unimportedMarkdownGists.map((gist) => ({
        type: 'gist' as const,
        label: gist.description?.trim() || 'Untitled gist',
        description: `${gist.fileCount} files`,
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
      return unimportedMarkdownGists;
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
      const session = await ensureGithubSession(
        scratchSignedIn,
        'create notes',
      );
      if (!session) {
        return;
      }

      const { config, gistsRoot } = await getScratchContext();
      const existingNoteNames = await collectExistingNoteNames(config);

      const title = await vscode.window.showInputBox({
        prompt: 'Enter a title for the new note',
        placeHolder: 'Untitled note',
        validateInput: buildNoteTitleValidator(existingNoteNames),
      });

      if (!title) {
        return;
      }

      const trimmedTitle = title.trim();
      const filename = `${trimmedTitle}.md`;

      statusBar.text = '$(sync~spin) Scratch: Creating note...';
      statusBar.command = COMMANDS.showGithubStatus;
      const noteContent = '# Start typing your note here...\n';

      const created = await createGist(session.accessToken, {
        description: trimmedTitle,
        files: {
          [filename]: noteContent,
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
      const gistFolder = vscode.Uri.joinPath(gistsRoot, created.id);
      await vscode.workspace.fs.createDirectory(gistFolder);

      const fileUri = vscode.Uri.joinPath(gistFolder, filename);
      await vscode.workspace.fs.writeFile(fileUri, encoder.encode(noteContent));

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
      refreshGistViews();
      await updateStatusBar();
    }
  }

  async function handleDeleteNote(): Promise<void> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage(MESSAGES.noFileOpen);
        return;
      }

      const fileUri = editor.document.uri;
      const { gistsRoot } = await getScratchContext();

      // Check if the file is within the gists directory
      if (!fileUri.fsPath.includes(gistsRoot.fsPath)) {
        vscode.window.showWarningMessage(MESSAGES.notScratchNote);
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

      await removeEmptyGistFolder(gistsRoot, fileUri, outputChannel);
      vscode.window.showInformationMessage('Note deleted successfully.');
      refreshGistViews();
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
        vscode.window.showWarningMessage(MESSAGES.noFileOpen);
        return;
      }

      const fileUri = editor.document.uri;
      const { config, scratchRoot, gistsRoot } = await getScratchContext();

      // Check if the file is within the gists directory
      if (!fileUri.fsPath.includes(gistsRoot.fsPath)) {
        vscode.window.showWarningMessage(MESSAGES.notScratchNote);
        return;
      }

      const currentName = path.basename(fileUri.fsPath, '.md');
      const existingNoteNames = await collectExistingNoteNames(config);
      existingNoteNames.delete(`${currentName}.md`.toLowerCase());
      const newName = await vscode.window.showInputBox({
        prompt: 'Enter new name for the note',
        value: currentName,
        validateInput: buildNoteTitleValidator(existingNoteNames),
      });

      if (!newName || newName.trim() === currentName) {
        return;
      }

      const trimmedName = newName.trim();
      const newFileName = `${trimmedName}.md`;
      const parentDir = fileUri.with({ path: path.dirname(fileUri.path) });
      const newFileUri = vscode.Uri.joinPath(parentDir, newFileName);
      const gistInfo = getGistInfoFromUri(scratchRoot, fileUri);
      const contents = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(contents).toString('utf-8');

      // Rename the file
      await vscode.workspace.fs.rename(fileUri, newFileUri);

      if (gistInfo) {
        const oldFilePath = normalizePath(gistInfo.filePath);
        const parentPath = path.posix.dirname(oldFilePath);
        const newFilePath =
          parentPath === '.' ? newFileName : `${parentPath}/${newFileName}`;
        const session = scratchSignedIn ? await getGithubSession(false) : null;

        if (session) {
          await updateGistFiles({
            accessToken: session.accessToken,
            gistId: gistInfo.gistId,
            files: {
              [oldFilePath]: null,
              [newFilePath]: content,
            },
          });
        }
      }

      // Open the renamed file
      const document = await vscode.workspace.openTextDocument(newFileUri);
      await vscode.window.showTextDocument(document, { preview: false });

      vscode.window.showInformationMessage('Note renamed successfully.');
      refreshGistViews();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to rename note. ${String(error)}`,
      );
    }
  }

  async function handleOpenNoteInBrowser(item?: {
    resourceUri?: vscode.Uri;
    gistId?: string;
  }): Promise<void> {
    try {
      const selectedItem =
        item ?? gistFlatView.selection?.[0] ?? gistView.selection?.[0];
      let gistId = selectedItem?.gistId;
      if (!gistId) {
        const fileUri =
          selectedItem?.resourceUri ??
          vscode.window.activeTextEditor?.document.uri;
        if (fileUri) {
          const { scratchRoot } = await getScratchContext();
          const gistInfo = getGistInfoFromUri(scratchRoot, fileUri);
          gistId = gistInfo?.gistId;
        }
      }

      if (!gistId) {
        vscode.window.showWarningMessage(MESSAGES.notScratchNote);
        return;
      }

      const url = `https://gist.github.com/${gistId}`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to open note in browser. ${String(error)}`,
      );
    }
  }

  async function handleAddNoteToGist(item?: {
    gistId?: string;
  }): Promise<void> {
    try {
      const session = await ensureGithubSession(
        scratchSignedIn,
        'add notes to gist',
      );
      if (!session) {
        return;
      }

      const selectedItem = item ?? gistView.selection?.[0];
      if (!selectedItem) {
        vscode.window.showErrorMessage('Scratchpad: no gist selected.');
        return;
      }

      const gistId = selectedItem.gistId;
      if (!gistId) {
        vscode.window.showErrorMessage('Scratchpad: could not determine gist.');
        return;
      }

      const { config, gistsRoot } = await getScratchContext();
      const existingNoteNames = await collectExistingNoteNames(config);

      const title = await vscode.window.showInputBox({
        prompt: 'Enter a title for the new note',
        placeHolder: 'Untitled note',
        validateInput: buildNoteTitleValidator(existingNoteNames),
      });

      if (!title) {
        return;
      }

      const trimmedTitle = title.trim();
      const filename = `${trimmedTitle}.md`;

      const gistFolder = vscode.Uri.joinPath(gistsRoot, gistId);

      const encoder = new TextEncoder();
      const fileUri = vscode.Uri.joinPath(gistFolder, filename);
      const noteContent = '# Start typing your note here...\n';

      await vscode.workspace.fs.writeFile(fileUri, encoder.encode(noteContent));

      // Update in GitHub
      await updateGistFile({
        accessToken: session.accessToken,
        gistId,
        filename,
        content: noteContent,
      });

      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, { preview: false });

      outputChannel.appendLine(`Added note to gist ${gistId} (${filename}).`);
      vscode.window.showInformationMessage('Note added to gist.');
      refreshGistViews();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to add note to gist. ${String(error)}`,
      );
    }
  }

  async function handleDeleteGist(item?: { gistId?: string }): Promise<void> {
    try {
      const selectedItem = item ?? gistView.selection?.[0];
      if (!selectedItem) {
        vscode.window.showErrorMessage('Scratchpad: no gist selected.');
        return;
      }

      const gistId = selectedItem.gistId;
      if (!gistId) {
        vscode.window.showErrorMessage('Scratchpad: could not determine gist.');
        return;
      }

      const confirmation = await vscode.window.showWarningMessage(
        `Delete gist "${gistId}" and all its notes?`,
        { modal: true },
        'Delete',
      );

      if (confirmation !== 'Delete') {
        return;
      }

      const { gistsRoot } = await getScratchContext();
      const gistFolder = vscode.Uri.joinPath(gistsRoot, gistId);

      // Delete locally
      await vscode.workspace.fs.delete(gistFolder, {
        recursive: true,
        useTrash: true,
      });

      // Delete from GitHub if signed in
      const session = scratchSignedIn ? await getGithubSession(false) : null;
      if (session) {
        try {
          const gistDetail = await fetchGist(session.accessToken, gistId);
          const filesToDelete: Record<string, string | null> = {};
          for (const file of gistDetail.files) {
            filesToDelete[file.filename] = null;
          }
          await updateGistFiles({
            accessToken: session.accessToken,
            gistId,
            files: filesToDelete,
          });
        } catch (error) {
          outputChannel.appendLine(
            `Failed to delete gist from GitHub: ${String(error)}`,
          );
        }
      }

      // Remove from cache
      gistIdCache.delete(gistId);
      await context.globalState.update(
        'scratch.gistIds',
        Array.from(gistIdCache),
      );

      outputChannel.appendLine(`Deleted gist ${gistId}.`);
      vscode.window.showInformationMessage('Gist deleted.');
      refreshGistViews();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to delete gist. ${String(error)}`,
      );
    }
  }

  async function handleGithubSignIn(): Promise<void> {
    try {
      const sessionInfo = await signInGithub(context);
      await updateScratchSignedIn();
      refreshGistViews();
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
      await updateScratchSignedIn();
      refreshGistViews();
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
      if (!scratchSignedIn) {
        statusBar.text = '$(github) Scratch: Sign in';
        statusBar.tooltip = 'Scratchpad: Sign in to GitHub';
        statusBar.command = COMMANDS.signInGithub;
        return;
      }

      const session = await getGithubSession(false);

      if (!session) {
        statusBar.text = '$(github) Scratch: Sign in';
        statusBar.tooltip = 'Scratchpad: Sign in to GitHub';
        statusBar.command = COMMANDS.signInGithub;
        return;
      }

      const lastRefreshLabel = lastGistRefreshAt
        ? `Last refresh: ${lastGistRefreshAt.toLocaleString()}`
        : 'Last refresh: never';
      statusBar.text = '$(refresh) Scratch: Refresh gists';
      statusBar.tooltip = `Scratchpad: Refresh gists (${session.account.label})\n${lastRefreshLabel}`;
      statusBar.command = COMMANDS.refreshGists;
    } catch (error) {
      statusBar.text = '$(github) Scratch: Auth error';
      statusBar.tooltip = `Scratchpad: ${String(error)}`;
      statusBar.command = COMMANDS.showGithubStatus;
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
        const gistsRoot = vscode.Uri.joinPath(options.scratchRoot, 'gists');
        await removeEmptyGistFolder(
          gistsRoot,
          options.fileUri,
          options.outputChannel,
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
