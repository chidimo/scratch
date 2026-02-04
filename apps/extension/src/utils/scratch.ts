import * as vscode from "vscode";
import { ScratchConfig } from "../types";

const GISTS_FOLDER_NAME = "gists";

export function getScratchRoot(config: ScratchConfig): vscode.Uri {
  return vscode.Uri.file(config.storagePath);
}

export function getGistsRoot(config: ScratchConfig): vscode.Uri {
  return vscode.Uri.joinPath(getScratchRoot(config), GISTS_FOLDER_NAME);
}

export async function ensureScratchRoot(
  config: ScratchConfig
): Promise<vscode.Uri> {
  const root = getScratchRoot(config);
  await vscode.workspace.fs.createDirectory(root);
  await vscode.workspace.fs.createDirectory(getGistsRoot(config));
  return root;
}

export function createScratchWatcher(
  config: ScratchConfig
): vscode.FileSystemWatcher {
  const pattern = new vscode.RelativePattern(
    getScratchRoot(config),
    `${GISTS_FOLDER_NAME}/**/*`
  );

  return vscode.workspace.createFileSystemWatcher(pattern);
}
