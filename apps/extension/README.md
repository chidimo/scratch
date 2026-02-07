# Scratchpad VSCode Extension

Scratchpad brings a lightweight `.scratch` workspace into VS Code with GitHub Gist sync.

## Features

- Detects `.scratch` folders in your workspace
- Creates the folder automatically if enabled
- Logs file changes within the scratch folder
- Shows user identity based on Git configuration
- Syncs GitHub Gists into `.scratch/gists`
- Two-way updates for markdown gists (local edits push to GitHub)
- Optional auto-refresh to pull remote changes on a timer

## Commands

- `Scratch: Create .scratch Folder`
- `Scratch: Open .scratch Folder`
- `Scratch: Show User Identity`
- `Scratch: Sign In to GitHub`
- `Scratch: Sign Out of GitHub`
- `Scratch: Show GitHub Status`
- `Scratch: Sync GitHub Gists`
- `Scratch: Refresh Imported Gists`
- `Scratch: Refresh Scratch State`

## Configuration

- `scratch.scratchFolderName`
- `scratch.autoCreateScratchFolder`
- `scratch.watchScratchFolder`
- `scratch.userIdStrategy`
- `scratch.gistAutoRefreshMinutes` (default: 0; options: 0, 5, 10, 15, 20, 25, 30 minutes; 0 disables auto-refresh)
