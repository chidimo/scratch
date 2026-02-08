// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import * as path from 'node:path';
import { getScratchContext, isMarkdownFile } from '../utils/scratch';

type TreeItemKind = 'gist' | 'file' | 'empty';

class GistTreeItem extends vscode.TreeItem {
  gistId?: string;

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

    // Store gist ID for gist items
    if (kind === 'gist') {
      this.gistId = label;
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

async function listMarkdownFiles(
  root: vscode.Uri,
  prefix = '',
): Promise<{ relativePath: string; uri: vscode.Uri }[]> {
  const entries = await vscode.workspace.fs.readDirectory(root);
  const results: { relativePath: string; uri: vscode.Uri }[] = [];

  for (const [name, type] of entries) {
    const entryUri = vscode.Uri.joinPath(root, name);

    if (type === vscode.FileType.Directory) {
      const nestedPrefix = prefix ? `${prefix}/${name}` : name;
      const nested = await listMarkdownFiles(entryUri, nestedPrefix);
      results.push(...nested);
    } else if (type === vscode.FileType.File && isMarkdownFile(name)) {
      const relativePath = prefix ? path.posix.join(prefix, name) : name;
      results.push({ relativePath, uri: entryUri });
    }
  }

  return results;
}

export class GistTreeProvider implements vscode.TreeDataProvider<GistTreeItem> {
  constructor(private readonly options: { flat: boolean }) {}

  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    GistTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  async getChildren(element?: GistTreeItem): Promise<GistTreeItem[]> {
    const { gistsRoot } = await getScratchContext();

    try {
      if (!element) {
        if (this.options.flat) {
          const markdownFiles = await listMarkdownFiles(gistsRoot);

          if (!markdownFiles.length) {
            return [
              new GistTreeItem(
                'empty',
                'No gists yet',
                vscode.TreeItemCollapsibleState.None,
              ),
            ];
          }

          return markdownFiles
            .map((file) => {
              const segments = file.relativePath.split('/').filter(Boolean);
              const gistId = segments[0] ?? '';
              const fileLabel =
                segments.slice(1).join('/') || file.relativePath;
              const item = new GistTreeItem(
                'file',
                fileLabel,
                vscode.TreeItemCollapsibleState.None,
                file.uri,
                file.relativePath,
              );
              item.description = gistId;
              item.command = {
                command: 'vscode.open',
                title: 'Open Note',
                arguments: [file.uri],
              };
              return item;
            })
            .sort((a, b) =>
              (a.label as string).localeCompare(b.label as string),
            );
        }

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
              vscode.TreeItemCollapsibleState.Collapsed,
              vscode.Uri.joinPath(gistsRoot, name),
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
