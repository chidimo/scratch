// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as path from 'node:path';
import { getScratchContext, listMarkdownFiles } from '../utils/scratch';
import { COMMANDS } from '../constants';

type TodoEntry = {
  uri: vscode.Uri;
  line: number;
  label: string;
  relativePath: string;
};

class TodoTreeItem extends vscode.TreeItem {
  constructor(entry: TodoEntry) {
    super(entry.label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('checklist');
    const noteName = path.posix.basename(entry.relativePath);
    this.description = `${noteName}:${entry.line + 1}`;
    this.command = {
      command: COMMANDS.openTodoLocation,
      title: 'Open TODO',
      arguments: [entry],
    };
  }
}

function extractTodoLabel(line: string): string | null {
  const taskPattern = /^\s*[-*]\s+\[ \]\s+(.*)$/;
  const taskMatch = taskPattern.exec(line);
  if (taskMatch) {
    return taskMatch[1].trim() || 'TODO';
  }

  const todoPattern = /\bTODO\b/i;
  if (todoPattern.test(line)) {
    return line.trim().replace(/\s+/g, ' ');
  }

  return null;
}

function collectTodos(content: string, relativePath: string, uri: vscode.Uri): TodoEntry[] {
  const entries: TodoEntry[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const label = extractTodoLabel(line);
    if (label) {
      entries.push({ uri, line: index, label, relativePath });
    }
  });

  return entries;
}

export class TodoTreeProvider implements vscode.TreeDataProvider<TodoTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    TodoTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TodoTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TodoTreeItem): Promise<TodoTreeItem[]> {
    if (element) {
      return [];
    }

    const { gistsRoot } = await getScratchContext();
    const markdownFiles = await listMarkdownFiles(gistsRoot);

    if (!markdownFiles.length) {
      const emptyItem = new vscode.TreeItem(
        'No notes yet',
        vscode.TreeItemCollapsibleState.None,
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return [emptyItem];
    }

    const todos: TodoEntry[] = [];

    for (const file of markdownFiles) {
      const contents = await vscode.workspace.fs.readFile(file.uri);
      const content = Buffer.from(contents).toString('utf-8');
      todos.push(...collectTodos(content, file.relativePath, file.uri));
    }

    if (!todos.length) {
      const emptyItem = new vscode.TreeItem(
        'No TODOs found',
        vscode.TreeItemCollapsibleState.None,
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return [emptyItem];
    }

    todos.sort((a, b) => {
      if (a.relativePath === b.relativePath) {
        return a.line - b.line;
      }
      return a.relativePath.localeCompare(b.relativePath);
    });

    return todos.map((entry) => new TodoTreeItem(entry));
  }
}
