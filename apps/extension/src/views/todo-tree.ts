// eslint-disable-next-line import/no-unresolved
import * as path from 'node:path';
import * as vscode from 'vscode';
import { COMMANDS } from '../constants';
import { getScratchContext, listMarkdownFiles } from '../utils/scratch';

type TodoEntry = {
  uri: vscode.Uri;
  line: number;
  label: string;
  relativePath: string;
};

class TodoTreeItem extends vscode.TreeItem {
  constructor(entry: TodoEntry, showFileInDescription = false) {
    super(entry.label, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('checklist');
    if (showFileInDescription) {
      const noteName = path.posix.basename(entry.relativePath);
      this.description = `${noteName}:${entry.line + 1}`;
    } else {
      this.description = `line ${entry.line + 1}`;
    }
    this.command = {
      command: COMMANDS.openTodoLocation,
      title: 'Open TODO',
      arguments: [entry],
    };
  }
}

class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly relativePath: string,
    public readonly todos: TodoEntry[],
  ) {
    super(
      path.posix.basename(relativePath),
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.iconPath = new vscode.ThemeIcon('folder');
    this.description = `${todos.length} TODO${todos.length > 1 ? 's' : ''}`;
    this.resourceUri = todos[0]?.uri;
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

function collectTodos(
  content: string,
  relativePath: string,
  uri: vscode.Uri,
): TodoEntry[] {
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

export class TodoTreeProvider
  implements vscode.TreeDataProvider<TodoTreeItem | FileTreeItem>
{
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    TodoTreeItem | FileTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: TodoTreeItem | FileTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: TodoTreeItem | FileTreeItem,
  ): Promise<(TodoTreeItem | FileTreeItem)[]> {
    if (element instanceof TodoTreeItem) {
      return [];
    }

    if (element instanceof FileTreeItem) {
      return element.todos.map((entry) => new TodoTreeItem(entry));
    }

    const { config, gistsRoot } = await getScratchContext();
    const markdownFiles = await listMarkdownFiles(gistsRoot);

    if (!markdownFiles.length) {
      const emptyItem = new vscode.TreeItem(
        'No notes yet',
        vscode.TreeItemCollapsibleState.None,
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return [emptyItem as any];
    }

    if (config.groupTodosByFile) {
      const todosByFile = new Map<string, TodoEntry[]>();

      for (const file of markdownFiles) {
        const contents = await vscode.workspace.fs.readFile(file.uri);
        const content = Buffer.from(contents).toString('utf-8');
        const fileTodos = collectTodos(content, file.relativePath, file.uri);

        if (fileTodos.length > 0) {
          todosByFile.set(file.relativePath, fileTodos);
        }
      }

      if (todosByFile.size === 0) {
        const emptyItem = new vscode.TreeItem(
          'No TODOs found',
          vscode.TreeItemCollapsibleState.None,
        );
        emptyItem.iconPath = new vscode.ThemeIcon('info');
        return [emptyItem as any];
      }

      const sortedFiles = Array.from(todosByFile.keys()).sort((a, b) =>
        a.localeCompare(b),
      );

      return sortedFiles.map((relativePath) => {
        const fileTodos = todosByFile.get(relativePath)!;
        return new FileTreeItem(relativePath, fileTodos);
      });
    }

    // Flat list view
    const allTodos: TodoEntry[] = [];
    for (const file of markdownFiles) {
      const contents = await vscode.workspace.fs.readFile(file.uri);
      const content = Buffer.from(contents).toString('utf-8');
      allTodos.push(...collectTodos(content, file.relativePath, file.uri));
    }

    if (allTodos.length === 0) {
      const emptyItem = new vscode.TreeItem(
        'No TODOs found',
        vscode.TreeItemCollapsibleState.None,
      );
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return [emptyItem as any];
    }

    allTodos.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

    return allTodos.map((entry) => new TodoTreeItem(entry, true));
  }
}
