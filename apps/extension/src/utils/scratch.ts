import * as vscode from "vscode";
import { ScratchConfig } from "../config";
import { getWorkspaceFolders } from "./workspace";

export interface ScratchFolderInfo {
  workspaceFolder: vscode.WorkspaceFolder;
  scratchUri: vscode.Uri;
  exists: boolean;
}

export async function getScratchFolderInfos(
  config: ScratchConfig
): Promise<ScratchFolderInfo[]> {
  const folders = getWorkspaceFolders();

  const infos = await Promise.all(
    folders.map(async (workspaceFolder) => {
      const scratchUri = vscode.Uri.joinPath(
        workspaceFolder.uri,
        config.scratchFolderName
      );

      try {
        const stat = await vscode.workspace.fs.stat(scratchUri);
        const exists =
          (stat.type & vscode.FileType.Directory) ===
          vscode.FileType.Directory;

        return { workspaceFolder, scratchUri, exists };
      } catch (error) {
        return { workspaceFolder, scratchUri, exists: false };
      }
    })
  );

  return infos;
}

export async function ensureScratchFolder(
  info: ScratchFolderInfo,
  config: ScratchConfig
): Promise<ScratchFolderInfo> {
  if (info.exists || !config.autoCreateScratchFolder) {
    return info;
  }

  await vscode.workspace.fs.createDirectory(info.scratchUri);
  return { ...info, exists: true };
}

export function createScratchWatcher(
  workspaceFolder: vscode.WorkspaceFolder,
  config: ScratchConfig
): vscode.FileSystemWatcher {
  const pattern = new vscode.RelativePattern(
    workspaceFolder,
    `${config.scratchFolderName}/**/*`
  );

  return vscode.workspace.createFileSystemWatcher(pattern);
}
