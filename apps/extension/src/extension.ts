import * as vscode from "vscode";
import {
  getGithubSession,
  signInGithub,
  signOutGithub,
} from "./auth/github";
import { getScratchConfig } from "./config";
import { syncGists } from "./services/gist-sync";
import { getGitUserIdentity } from "./utils/git";
import { createScratchWatcher, ensureScratchFolder, getScratchFolderInfos } from "./utils/scratch";
import { hasWorkspaceFolders } from "./utils/workspace";

let watchers: vscode.FileSystemWatcher[] = [];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel("Scratch");
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
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

      statusBar.text = "$(sync~spin) Scratch: Syncing gists...";
      statusBar.command = "scratch.showGithubStatus";

      await syncGists({
        accessToken: session.accessToken,
        outputChannel,
      });

      vscode.window.showInformationMessage("Scratchpad: Gist sync complete.");
    } catch (error) {
      vscode.window.showErrorMessage(
        `Scratchpad: gist sync failed. ${String(error)}`
      );
    } finally {
      await updateStatusBar();
    }
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

      statusBar.text = "$(sync) Scratch: Sync gists";
      statusBar.tooltip = `Scratchpad: Sync gists (${session.account.label})`;
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
    });
    watcher.onDidChange((uri) => {
      outputChannel.appendLine(`Scratch file updated: ${uri.fsPath}`);
    });
    watcher.onDidDelete((uri) => {
      outputChannel.appendLine(`Scratch file deleted: ${uri.fsPath}`);
    });
  }
}

function disposeWatchers(): void {
  for (const watcher of watchers) {
    watcher.dispose();
  }
  watchers = [];
}
