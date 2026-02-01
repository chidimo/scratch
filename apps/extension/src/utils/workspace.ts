import * as vscode from "vscode";

export function getWorkspaceFolders(): vscode.WorkspaceFolder[] {
  return [...(vscode.workspace.workspaceFolders ?? [])];
}

export function hasWorkspaceFolders(): boolean {
  return getWorkspaceFolders().length > 0;
}
