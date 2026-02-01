import * as path from "node:path";
import * as vscode from "vscode";
import {
  getGithubSession,
  signInGithub,
  signOutGithub,
} from "./auth/github";
import { getScratchConfig } from "./config";
import {
  fetchGist,
  GistSummary,
  listGists,
  updateGistFile,
} from "./services/gist-sync";
import { ScratchFolderInfo } from "./types";
import { getGitUserIdentity } from "./utils/git";
import { createScratchWatcher, ensureScratchFolder, getScratchFolderInfos } from "./utils/scratch";
import { hasWorkspaceFolders } from "./utils/workspace";

let watchers: vscode.FileSystemWatcher[] = [];
const gistUpdateTimers = new Map<string, NodeJS.Timeout>();
const GIST_UPDATE_DEBOUNCE_MS = 2000;
const gistIdCache = new Set<string>();
const gistDeleteTimers = new Map<string, NodeJS.Timeout>();
let lastGistRefreshAt: Date | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel("Scratch");
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  hydrateGistIdCache(context);
  const disposables: vscode.Disposable[] = [
    outputChannel,
    statusBar,
    vscode.commands.registerCommand(
      "scratch.refreshScratchState",
      refreshScratchState
    ),
    vscode.commands.registerCommand(
      "scratch.createScratchFolder",
      refreshScratchState
    ),
    vscode.commands.registerCommand("scratch.showUserIdentity", showUserIdentity),
    vscode.commands.registerCommand("scratch.showGithubStatus", showGithubStatus),
    vscode.commands.registerCommand("scratch.signInGithub", handleGithubSignIn),
    vscode.commands.registerCommand("scratch.signOutGithub", handleGithubSignOut),
    vscode.commands.registerCommand("scratch.syncGists", handleGistSync),
    vscode.commands.registerCommand("scratch.refreshGists", handleGistRefresh),
    vscode.commands.registerCommand("scratch.openScratchFolder", async () => {
      const config = getScratchConfig();
      const scratchInfos = await getScratchFolderInfos(config);
      const existing = scratchInfos.filter((info) => info.exists);

      if (!existing.length) {
        vscode.window.showWarningMessage(
          "Scratchpad: no scratch folder found in the workspace."
        );
        return;
      }

      if (existing.length === 1) {
        await vscode.commands.executeCommand(
          "revealInExplorer",
          existing[0].scratchUri
        );
        return;
      }

      const selected = await vscode.window.showQuickPick(
        existing.map((info) => ({
          label: info.workspaceFolder.name,
          description: info.scratchUri.fsPath,
          info,
        })),
        { placeHolder: "Select a scratch folder to reveal" }
      );

      if (selected) {
        await vscode.commands.executeCommand(
          "revealInExplorer",
          selected.info.scratchUri
        );
      }
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("scratch")) {
        refreshScratchState().catch((error) => {
          outputChannel.appendLine(
            `Failed to refresh scratch state: ${String(error)}`
          );
        });
        scheduleAutoRefresh();
      }
    }),
    vscode.authentication.onDidChangeSessions(async (event) => {
      if (event.provider.id === "github") {
        await updateStatusBar();
      }
    }),
  ];

  async function refreshScratchState(): Promise<void> {
    const config = getScratchConfig();
    const scratchInfos = await getScratchFolderInfos(config);

    if (!scratchInfos.length) {
      outputChannel.appendLine("No workspace folders detected.");
      return;
    }

    const ensured = await Promise.all(
      scratchInfos.map(async (info) => ensureScratchFolder(info, config))
    );

    for (const info of ensured) {
      if (info.exists) {
        outputChannel.appendLine(
          `Scratch folder ready: ${info.scratchUri.fsPath}`
        );
      } else {
        outputChannel.appendLine(
          `Scratch folder missing: ${info.scratchUri.fsPath}`
        );
      }
    }

    resetWatchers(config, outputChannel, ensured);
  }

  async function showUserIdentity(): Promise<void> {
    const config = getScratchConfig();

    if (!hasWorkspaceFolders()) {
      vscode.window.showWarningMessage(
        "Scratchpad: open a workspace to detect user identity."
      );
      return;
    }

    if (config.userIdStrategy !== "git") {
      vscode.window.showErrorMessage(
        `Scratchpad: unsupported userIdStrategy "${config.userIdStrategy}".`
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
        "Scratchpad: Git user identity not configured."
      );
      return;
    }

    const display = [
      identity.name ? `Name: ${identity.name}` : null,
      identity.email ? `Email: ${identity.email}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    vscode.window.showInformationMessage(
      `Scratchpad user (${identity.source}): ${display}`
    );
  }

  async function showGithubStatus(): Promise<void> {
    try {
      const session = await getGithubSession(false);

      if (!session) {
        vscode.window.showWarningMessage(
          "Scratchpad: no GitHub session found. Run Scratch: Sign In to GitHub."
        );
        return;
      }

      vscode.window.showInformationMessage(
        `Scratchpad: GitHub session active for ${session.account.label}.`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: failed to read GitHub session. ${String(error)}`
      );
    }
  }

  async function handleGistSync(): Promise<void> {
    try {
      const session = await getGithubSession(true);

      if (!session) {
        vscode.window.showWarningMessage(
          "Scratchpad: GitHub sign-in required to sync gists."
        );
        return;
      }

      const config = getScratchConfig();
      const targetInfo = await pickScratchTarget(config);
      if (!targetInfo) {
        return;
      }

      statusBar.text = "$(sync~spin) Scratch: Loading gists...";
      statusBar.command = "scratch.showGithubStatus";
      outputChannel.appendLine("Scratchpad: fetching gist list...");

      const selectedGists = await pickMarkdownGists(session.accessToken);
      if (!selectedGists?.length) {
        return;
      }

      updateGistIdCache(context, selectedGists.map((gist) => gist.id));

      const encoder = new TextEncoder();
      const root = vscode.Uri.joinPath(targetInfo.scratchUri, "gists");
      await vscode.workspace.fs.createDirectory(root);

      for (const gist of selectedGists) {
        const gistDetail = await fetchGist(session.accessToken, gist.id);
        const gistFolder = vscode.Uri.joinPath(root, gistDetail.id);
        await vscode.workspace.fs.createDirectory(gistFolder);

        const markdownFiles = gistDetail.files.filter((file) =>
          isMarkdownFile(file.filename)
        );

        if (!markdownFiles.length) {
          continue;
        }

        for (const file of markdownFiles) {
          const fileUri = vscode.Uri.joinPath(gistFolder, file.filename);
          await vscode.workspace.fs.writeFile(
            fileUri,
            encoder.encode(file.content)
          );
        }

        outputChannel.appendLine(
          `Imported gist ${gistDetail.id} (${markdownFiles.length} markdown files)`
        );
      }

      vscode.window.showInformationMessage(
        `Scratchpad: imported ${selectedGists.length} gist(s) into ${root.fsPath}.`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist sync failed. ${String(error)}`
      );
    } finally {
      await updateStatusBar();
    }
  }

  async function handleGistRefresh(): Promise<void> {
    try {
      const session = await getGithubSession(true);

      if (!session) {
        vscode.window.showWarningMessage(
          "Scratchpad: GitHub sign-in required to refresh gists."
        );
        return;
      }

      const config = getScratchConfig();
      const targetInfo = await pickScratchTarget(config);
      if (!targetInfo) {
        return;
      }

      const root = vscode.Uri.joinPath(targetInfo.scratchUri, "gists");
      const entries = await vscode.workspace.fs.readDirectory(root);
      const gistIds = entries
        .filter(([, type]) => type === vscode.FileType.Directory)
        .map(([name]) => name);

      if (!gistIds.length) {
        vscode.window.showInformationMessage(
          "Scratchpad: no imported gists found."
        );
        return;
      }

      updateGistIdCache(context, gistIds);

      statusBar.text = "$(sync~spin) Scratch: Refreshing gists...";
      statusBar.command = "scratch.showGithubStatus";
      outputChannel.appendLine("Scratchpad: refreshing gists from GitHub...");

      const encoder = new TextEncoder();

      for (const gistId of gistIds) {
        const gistDetail = await fetchGist(session.accessToken, gistId);
        const gistFolder = vscode.Uri.joinPath(root, gistDetail.id);
        await vscode.workspace.fs.createDirectory(gistFolder);

        const markdownFiles = gistDetail.files.filter((file) =>
          isMarkdownFile(file.filename)
        );
        const remoteMarkdownPaths = new Set(
          markdownFiles.map((file) => normalizePath(file.filename))
        );

        for (const file of markdownFiles) {
          const fileUri = vscode.Uri.joinPath(gistFolder, file.filename);
          await vscode.workspace.fs.writeFile(
            fileUri,
            encoder.encode(file.content)
          );
        }

        await removeStaleMarkdownFiles(gistFolder, remoteMarkdownPaths);
      }

      lastGistRefreshAt = new Date();
      vscode.window.showInformationMessage(
        `Scratchpad: refreshed ${gistIds.length} gist(s).`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist refresh failed. ${String(error)}`
      );
    } finally {
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

    gistRefreshInterval = setInterval(async () => {
      await handleGistRefresh();
    }, minutes * 60 * 1000);
  }



  async function pickScratchTarget(
    config: ReturnType<typeof getScratchConfig>
  ): Promise<ScratchFolderInfo | undefined> {
    const scratchInfos = await getScratchFolderInfos(config);

    if (!scratchInfos.length) {
      vscode.window.showWarningMessage(
        "Scratchpad: open a workspace to sync gists."
      );
      return undefined;
    }

    const ensured = await Promise.all(
      scratchInfos.map(async (info) => ensureScratchFolder(info, config))
    );

    const availableTargets = ensured.filter((info) => info.exists);
    if (!availableTargets.length) {
      vscode.window.showWarningMessage(
        "Scratchpad: no scratch folder available for sync."
      );
      return undefined;
    }

    if (availableTargets.length === 1) {
      return availableTargets[0];
    }

    const selectedTarget = await vscode.window.showQuickPick(
      availableTargets.map((info) => ({
        label: info.workspaceFolder.name,
        description: info.scratchUri.fsPath,
        info,
      })),
      { placeHolder: "Select a scratch folder for gist import" }
    );

    return selectedTarget?.info;
  }

  async function pickMarkdownGists(
    accessToken: string
  ): Promise<GistSummary[] | undefined> {
    const summaries = await listGists(accessToken);

    if (!summaries.length) {
      vscode.window.showInformationMessage("Scratchpad: no gists found.");
      return undefined;
    }

    const markdownGists = summaries.filter((gist) =>
      gist.fileNames.some(isMarkdownFile)
    );

    if (!markdownGists.length) {
      vscode.window.showInformationMessage(
        "Scratchpad: no markdown gists found."
      );
      return undefined;
    }

    type GistChoice =
      | { type: "all"; label: string; description: string }
      | {
          type: "gist";
          label: string;
          description: string;
          detail?: string;
          gist: GistSummary;
        };

    const gistChoices: GistChoice[] = [
      {
        type: "all",
        label: "Import all markdown gists",
        description: `${markdownGists.length} gists`,
      },
      ...markdownGists.map((gist) => ({
        type: "gist" as const,
        label: gist.description?.trim() || "Untitled gist",
        description: `${gist.fileCount} files`,
        detail: gist.htmlUrl,
        gist,
      })),
    ];

    const selections = await vscode.window.showQuickPick(gistChoices, {
      canPickMany: true,
      placeHolder: "Select markdown gists to import into .scratch",
    });

    if (!selections || selections.length === 0) {
      return undefined;
    }

    const includeAll = selections.some(
      (selection) => selection.type === "all"
    );

    if (includeAll) {
      return markdownGists;
    }

    return selections
      .filter((selection): selection is Extract<GistChoice, { type: "gist" }> =>
        selection.type === "gist"
      )
      .map((selection) => selection.gist);
  }

  async function handleGithubSignIn(): Promise<void> {
    try {
      const sessionInfo = await signInGithub(context);
      vscode.window.showInformationMessage(
        `Scratchpad: GitHub signed in as ${sessionInfo.accountLabel}.`
      );
      await updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: GitHub sign-in failed. ${String(error)}`
      );
    }
  }

  async function handleGithubSignOut(): Promise<void> {
    try {
      await signOutGithub(context);
      vscode.window.showInformationMessage(
        "Scratchpad: GitHub token removed. Sign out from the Accounts menu to revoke access."
      );
      await updateStatusBar();
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: GitHub sign-out failed. ${String(error)}`
      );
    }
  }

  async function updateStatusBar(): Promise<void> {
    try {
      const session = await getGithubSession(false);

      if (!session) {
        statusBar.text = "$(github) Scratch: Sign in";
        statusBar.tooltip = "Scratchpad: Sign in to GitHub";
        statusBar.command = "scratch.signInGithub";
        return;
      }

      const lastRefreshLabel = lastGistRefreshAt
        ? `Last refresh: ${lastGistRefreshAt.toLocaleString()}`
        : "Last refresh: never";
      statusBar.text = "$(sync) Scratch: Sync gists";
      statusBar.tooltip = `Scratchpad: Sync gists (${session.account.label})\n${lastRefreshLabel}`;
      statusBar.command = "scratch.syncGists";
    } catch (error) {
      statusBar.text = "$(github) Scratch: Auth error";
      statusBar.tooltip = `Scratchpad: ${String(error)}`;
      statusBar.command = "scratch.showGithubStatus";
    }
  }

  context.subscriptions.push(...disposables);

  await refreshScratchState();
  await updateStatusBar();
  scheduleAutoRefresh();
  statusBar.show();
  outputChannel.appendLine("Scratchpad extension activated.");
}

export function deactivate(): void {
  disposeWatchers();
}

function resetWatchers(
  config: ReturnType<typeof getScratchConfig>,
  outputChannel: vscode.OutputChannel,
  scratchInfos: Awaited<ReturnType<typeof getScratchFolderInfos>>
): void {
  disposeWatchers();

  if (!config.watchScratchFolder) {
    outputChannel.appendLine("Scratch folder watching disabled.");
    return;
  }

  watchers = scratchInfos.map((info) =>
    createScratchWatcher(info.workspaceFolder, config)
  );

  for (const watcher of watchers) {
    watcher.onDidCreate((uri) => {
      outputChannel.appendLine(`Scratch file created: ${uri.fsPath}`);
      void guardGistFolderMutation(uri, scratchInfos, outputChannel, "create");
      const scratchRoot = getScratchRootForUri(uri, scratchInfos);
      if (scratchRoot) {
        scheduleGistUpdate({
          scratchRoot,
          fileUri: uri,
          outputChannel,
        });
      }
    });
    watcher.onDidChange((uri) => {
      outputChannel.appendLine(`Scratch file updated: ${uri.fsPath}`);
      const scratchRoot = getScratchRootForUri(uri, scratchInfos);
      if (scratchRoot) {
        scheduleGistUpdate({
          scratchRoot,
          fileUri: uri,
          outputChannel,
        });
      }
    });
    watcher.onDidDelete((uri) => {
      outputChannel.appendLine(`Scratch file deleted: ${uri.fsPath}`);
      void guardGistFolderMutation(uri, scratchInfos, outputChannel, "delete");
      const scratchRoot = getScratchRootForUri(uri, scratchInfos);
      if (scratchRoot) {
        scheduleGistDelete({
          scratchRoot,
          fileUri: uri,
          outputChannel,
        });
      }
    });
  }
}

function disposeWatchers(): void {
  for (const watcher of watchers) {
    watcher.dispose();
  }
  watchers = [];
}

function getScratchRootForUri(
  uri: vscode.Uri,
  scratchInfos: Awaited<ReturnType<typeof getScratchFolderInfos>>
): vscode.Uri | undefined {
  for (const info of scratchInfos) {
    if (!info.exists) {
      continue;
    }

    const relative = path.relative(info.scratchUri.fsPath, uri.fsPath);
    if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
      return info.scratchUri;
    }
  }

  return undefined;
}

function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

async function listMarkdownFiles(
  root: vscode.Uri
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
        }))
      );
    } else if (type === vscode.FileType.File && isMarkdownFile(name)) {
      results.push({ relativePath: name, uri: entryUri });
    }
  }

  return results;
}

async function removeStaleMarkdownFiles(
  gistFolder: vscode.Uri,
  remoteMarkdownPaths: Set<string>
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
  fileUri: vscode.Uri
): { gistId: string; filePath: string } | undefined {
  const relativePath = path.relative(scratchRoot.fsPath, fileUri.fsPath);
  const segments = relativePath.split(path.sep);
  const gistsIndex = segments.indexOf("gists");

  if (gistsIndex < 0 || gistsIndex + 2 > segments.length - 1) {
    return undefined;
  }

  const gistId = segments[gistsIndex + 1];
  const fileSegments = segments.slice(gistsIndex + 2);
  if (!gistId || fileSegments.length === 0) {
    return undefined;
  }

  const filePath = fileSegments.join("/");
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
          `Skipped gist update (not signed in): ${options.fileUri.fsPath}`
        );
        return;
      }

      try {
        const contents = await vscode.workspace.fs.readFile(options.fileUri);
        const content = Buffer.from(contents).toString("utf-8");

        await updateGistFile({
          accessToken: session.accessToken,
          gistId: gistInfo.gistId,
          filename: gistInfo.filePath,
          content,
        });

        options.outputChannel.appendLine(
          `Updated gist ${gistInfo.gistId} -> ${gistInfo.filePath}`
        );
      } catch (error) {
        options.outputChannel.appendLine(
          `Failed to update gist ${gistInfo.gistId}: ${String(error)}`
        );
      }
    }, GIST_UPDATE_DEBOUNCE_MS)
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
          `Skipped gist delete (not signed in): ${options.fileUri.fsPath}`
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
          `Deleted gist file ${gistInfo.gistId} -> ${gistInfo.filePath}`
        );
      } catch (error) {
        options.outputChannel.appendLine(
          `Failed to delete gist ${gistInfo.gistId}: ${String(error)}`
        );
      }
    }, GIST_UPDATE_DEBOUNCE_MS)
  );
}

function hydrateGistIdCache(context: vscode.ExtensionContext): void {
  const stored = context.globalState.get<string[]>("scratch.gistIds", []);
  for (const id of stored) {
    gistIdCache.add(id);
  }
}

function updateGistIdCache(
  context: vscode.ExtensionContext,
  ids: string[]
): void {
  for (const id of ids) {
    gistIdCache.add(id);
  }
  void context.globalState.update(
    "scratch.gistIds",
    Array.from(gistIdCache)
  );
}

async function guardGistFolderMutation(
  uri: vscode.Uri,
  scratchInfos: Awaited<ReturnType<typeof getScratchFolderInfos>>,
  outputChannel: vscode.OutputChannel,
  type: "create" | "delete"
): Promise<void> {
  const scratchRoot = getScratchRootForUri(uri, scratchInfos);
  if (!scratchRoot) {
    return;
  }

  const relativePath = path.relative(scratchRoot.fsPath, uri.fsPath);
  const segments = relativePath.split(path.sep);

  if (segments[0] !== "gists" || segments.length < 2) {
    return;
  }

  const gistId = segments[1];
  if (!gistId || gistIdCache.has(gistId)) {
    return;
  }

  if (type === "delete") {
    outputChannel.appendLine(
      `Gist folder removed (${gistId}). Re-run sync to restore.`
    );
    return;
  }

  try {
    const stat = await vscode.workspace.fs.stat(uri);
    if ((stat.type & vscode.FileType.Directory) !== vscode.FileType.Directory) {
      return;
    }

    outputChannel.appendLine(
      `Blocked rename or creation of unknown gist folder: ${gistId}`
    );
    await vscode.workspace.fs.delete(uri, { recursive: true, useTrash: true });
  } catch (error) {
    outputChannel.appendLine(
      `Failed to validate gist folder ${gistId}: ${String(error)}`
    );
  }
}
