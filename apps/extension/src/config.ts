import * as vscode from "vscode";
import { ScratchConfig, UserIdStrategy } from "./types";

export function getScratchConfig(): ScratchConfig {
  const config = vscode.workspace.getConfiguration("scratch");

  return {
    scratchFolderName: config.get<string>("scratchFolderName", ".scratch"),
    autoCreateScratchFolder: config.get<boolean>(
      "autoCreateScratchFolder",
      true
    ),
    watchScratchFolder: config.get<boolean>("watchScratchFolder", true),
    userIdStrategy: config.get<UserIdStrategy>("userIdStrategy", "git"),
  };
}
