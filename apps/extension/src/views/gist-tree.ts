import * as vscode from 'vscode';
import { getScratchConfig } from '../config';
import { getGistsRoot } from '../utils/scratch';

type TreeItemKind = 'gist' | 'file' | 'empty';

class GistTreeItem extends vscode.TreeItem {
  constructor(
    public readonly kind: TreeItemKind,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    resourceUri?: vscode.Uri,
    public readonly tooltip?: string,
  ) {
    super(label, collapsibleState);
    if (resourceUri) {
      this.resourceUri = resourceUri;
    }

    // Set appropriate icons
    if (kind === 'gist') {
      this.iconPath = new vscode.ThemeIcon('folder');
    } else if (kind === 'file') {
      this.iconPath = new vscode.ThemeIcon('file-text');
    } else {
      this.iconPath = new vscode.ThemeIcon('info');
    }

    // Set context values for conditional menus
    this.contextValue = kind;
  }
}

function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.endsWith('.md') || lower.endsWith('.markdown');
}

export class GistTreeProvider implements vscode.TreeDataProvider<GistTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    GistTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: GistTreeItem): Promise<GistTreeItem[]> {
    const config = getScratchConfig();
    const gistsRoot = getGistsRoot(config);

    try {
      if (!element) {
        const entries = await vscode.workspace.fs.readDirectory(gistsRoot);
        const gistFolders = entries
          .filter(([, type]) => type === vscode.FileType.Directory)
          .map(([name]) => name)
          .sort((a, b) => a.localeCompare(b));

        if (!gistFolders.length) {
          return [
            new GistTreeItem(
              'empty',
              'No gists yet',
              vscode.TreeItemCollapsibleState.None,
            ),
          ];
        }

        return gistFolders.map(
          (name) =>
            new GistTreeItem(
              'gist',
              name,
              vscode.TreeItemCollapsibleState.Expanded,
            ),
        );
      }

      if (element.kind !== 'gist') {
        return [];
      }

      const gistFolder = vscode.Uri.joinPath(
        gistsRoot,
        element.label as string,
      );
      const entries = await vscode.workspace.fs.readDirectory(gistFolder);
      const markdownFiles = entries
        .filter(
          ([name, type]) =>
            type === vscode.FileType.File && isMarkdownFile(name),
        )
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b));

      if (!markdownFiles.length) {
        return [
          new GistTreeItem(
            'empty',
            'No markdown files',
            vscode.TreeItemCollapsibleState.None,
          ),
        ];
      }

      return markdownFiles.map((filename) => {
        const fileUri = vscode.Uri.joinPath(gistFolder, filename);
        const item = new GistTreeItem(
          'file',
          filename,
          vscode.TreeItemCollapsibleState.None,
          fileUri,
        );
        item.command = {
          command: 'vscode.open',
          title: 'Open Note',
          arguments: [fileUri],
        };
        return item;
      });
    } catch (error) {
      console.error('Failed to load Scratch gists tree.', error);
      return [
        new GistTreeItem(
          'empty',
          'Scratch folder not found',
          vscode.TreeItemCollapsibleState.None,
        ),
      ];
    }
  }

  getTreeItem(element: GistTreeItem): vscode.TreeItem {
    return element;
  }
}
