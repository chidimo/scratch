import * as os from "node:os";
import * as path from "node:path";
import * as vscode from "vscode";
import { ScratchConfig, UserIdStrategy } from "./types";

function resolveStoragePath(rawPath: string | undefined): string {
  if (!rawPath) {
    return path.join(os.homedir(), "Documents", "Scratch(Gists)");
  }

  if (rawPath.startsWith("~")) {
    return path.join(os.homedir(), rawPath.slice(1));
  }

  return rawPath;
}

export function getScratchConfig(): ScratchConfig {
  const config = vscode.workspace.getConfiguration("scratch");

  return {
    storagePath: resolveStoragePath(config.get<string>("storagePath")),
    scratchFolderName: config.get<string>("scratchFolderName", ".scratch"),
    autoCreateScratchFolder: config.get<boolean>(
      "autoCreateScratchFolder",
      true
    ),
    watchScratchFolder: config.get<boolean>("watchScratchFolder", true),
    userIdStrategy: config.get<UserIdStrategy>("userIdStrategy", "git"),
    gistAutoRefreshMinutes: config.get<number>("gistAutoRefreshMinutes", 0),
  };
}
