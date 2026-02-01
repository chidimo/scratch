import * as vscode from "vscode";
import { getScratchConfig } from "./config";
import { getGitUserIdentity } from "./utils/git";
import { createScratchWatcher, ensureScratchFolder, getScratchFolderInfos } from "./utils/scratch";
import { hasWorkspaceFolders } from "./utils/workspace";

let watchers: vscode.FileSystemWatcher[] = [];

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel("Scratch");
  context.subscriptions.push(outputChannel);

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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "scratch.refreshScratchState",
      refreshScratchState
    ),
    vscode.commands.registerCommand(
      "scratch.createScratchFolder",
      refreshScratchState
    ),
    vscode.commands.registerCommand("scratch.showUserIdentity", showUserIdentity),
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
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("scratch")) {
        refreshScratchState().catch((error) => {
          outputChannel.appendLine(
            `Failed to refresh scratch state: ${String(error)}`
          );
        });
      }
    })
  );

  await refreshScratchState();
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
