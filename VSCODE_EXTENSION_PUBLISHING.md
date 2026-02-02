# VSCode Extension Publishing Crash Course

This is a concise, end-to-end guide for creating, packaging, and publishing a VSCode extension to the major stores (VS Code Marketplace + Open VSX).

## 1) Build the Extension (Local)

- Scaffold: `yo code` (TypeScript) or your own structure.
- Implement: `src/extension.ts` with `activate()` and commands.
- Optional: bundle with webpack/esbuild for smaller packages.
- Compile: `yarn compile` (or `npm run compile`).

## Extension Runtime Flow (Scratchpad Example)

```mermaid
flowchart TD
  A[VSCode loads extension] --> B[activate()]
  B --> C[Read scratch config]
  C --> D[Detect .scratch folders]
  D --> E[Create folder if missing]
  E --> F[Attach file watchers]
  F --> G[Log changes to Output channel]
  B --> H[Register commands]
  H --> I[Command Palette triggers command]
  H --> J[GitHub auth command]
```

## Key Terms (Quick)

- Workspace folder: a folder opened in VSCode; multi-root workspaces can have several.
- File watcher: a listener that triggers when files change (create/edit/delete).
- Command palette command: entries shown in the Command Palette (⇧⌘P / Ctrl+Shift+P).

## Extension Development Crash Course (Succinct)

1. VSCode activates the extension based on `activationEvents`.
2. `activate()` runs once, registers commands, and sets up listeners.
3. Commands map to functions that do the real work.
4. File watchers keep the extension in sync with filesystem changes.
5. You iterate by running the Extension Development Host and testing commands.
6. GitHub OAuth uses VS Code's built-in auth provider and stores tokens in `context.secrets`.

## GitHub OAuth (Scratchpad Example)

- Command Palette: `Scratch: Sign In to GitHub` opens VS Code's GitHub auth flow.
- Tokens are stored via `context.secrets` and can be removed with `Scratch: Sign Out of GitHub`.
- Status check: `Scratch: Show GitHub Status`.

## Testing Before Release (Quick)

- Manual: run the Extension Development Host (F5), then use the Command Palette.
- Smoke test: open a repo, run commands, confirm logs in Output panel.
- Automated: use `@vscode/test-electron` for integration tests.

## Running the Extension Development Host

- Open `apps/extension` in VS Code.
- Press `F5` to launch a new Extension Development Host window.
- Use the Command Palette to run `Scratch:` commands and check the Output panel.

## 2) Prepare Metadata (`package.json`)

Required:

- `name`, `publisher`, `version`, `engines.vscode`
- `main`, `activationEvents`, `contributes`
- `repository`, `license`, `displayName`, `description`
- Optional but recommended: `icon`, `categories`, `keywords`

## 3) Package the VSIX

- Install VSCE: `yarn add -D @vscode/vsce`
- Package: `yarn vsce package`
- Output: `your-extension-x.y.z.vsix`

## 4) Publish to VS Code Marketplace

One-time setup:

- Create a publisher: <https://marketplace.visualstudio.com/manage>
- Generate a PAT in Azure DevOps:
  - Go to <https://dev.azure.com/> → User settings → Personal access tokens
  - Create a token with scope: `Marketplace > Publish`
- Login: `npx vsce login <publisher>`

Publish:

- `npx vsce publish`
- Or `npx vsce publish --pat <TOKEN>`

## 5) Publish to Open VSX (VSCodium / Gitpod / Theia)

One-time setup:

- Create account: <https://open-vsx.org>
- Create a namespace (often same as your publisher)
- Generate a token in Open VSX:
  - Go to <https://open-vsx.org/user-settings/tokens>
  - Create a token with `Publish` permission

Publish:

- Install CLI: `yarn add -D ovsx`
- `npx ovsx publish -p <OPEN_VSX_TOKEN>`

## 6) Release Flow (Recommended)

- Bump `version` in `package.json`
- `yarn compile`
- `yarn vsce package`
- `npx vsce publish`
- `npx ovsx publish -p <TOKEN>`

Tagging:

- `git tag v0.1.1`
- `git push origin v0.1.1`

## 7) Automate Releases (CI/CD)

Use GitHub Actions to:

- Compile and test
- Package
- Publish to both marketplaces on tag push (e.g. `vX.Y.Z`)

Workflow file:

- `.github/workflows/publish-extension.yml`

Required GitHub secrets:

- `VSCE_PAT`
- `OVSX_TOKEN`

Manual workflow trigger (dry run):

- Actions → “Publish VSCode Extension” → Run workflow
- Set `dry_run=true` to skip publishing and only build/package

## 8) “All Stores” Reality Check

The primary stores are:

- VS Code Marketplace (Microsoft)
- Open VSX (VSCodium, Gitpod, Eclipse Theia)

There is no separate Apple/Google store for VSCode extensions.
