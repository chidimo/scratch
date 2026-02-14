# Scratchpad VSCode Extension

Scratchpad brings a lightweight GitHub Gist-powered note system into VS Code with automatic sync and dual view modes.

## 🔗 Links

- **Web app**: <https://scratch.chidiorji.com/>
- **VS Code Marketplace**: <https://marketplace.visualstudio.com/items?itemName=chidimo.scratch>
- **Open VSX Registry**: <https://open-vsx.org/extension/chidimo/scratch>

## 📚 Documentation

- **[Deployment Guide](../../DEPLOYMENT.md)** - Extension publishing and web deployment instructions
- **[Contribution Guide](../../CONTRIBUTING.md)** - How to contribute to the project
- **[Implementation Plans](../../IMPLEMENTATION.md)** - Technical findings and implementation details
- **[Changelog](./CHANGELOG.md)** - Version history and release notes

## ✨ Features

### 📝 Note Management

- **Create Notes**: Create new markdown notes that automatically become GitHub Gists
- **Add to Gist**: Add additional notes to existing gists via inline action
- **Delete Notes**: Remove individual notes with automatic GitHub sync
- **Rename Notes**: Rename notes locally and remotely in one action
- **Open in Browser**: Open a note's gist on GitHub in your browser
- **Delete Gists**: Remove entire gists with all their notes

### 🔄 Sync & Auto-Refresh

- **Manual Sync**: Import selected GitHub Gists into your workspace
- **Smart Filtering**: Only shows unimported gists when syncing to avoid duplicates
- **Auto-Refresh**: Configurable timer (5-30 minutes) to pull remote changes
- **Two-Way Sync**: Local edits automatically push to GitHub after a debounce delay
- **File Watching**: Detects file changes, creations, and deletions
- **Empty Folder Cleanup**: Automatically removes empty gist folders after deleting last note

### 📊 Dual View Modes

#### Flat View (Scratch Notes)

- All notes in a single list for quick access
- Shows filename with gist ID as description
- Inline delete and rename actions on each note

#### Grouped View (Scratch Gists)

- Notes organized by gist ID in collapsible folders
- Inline actions on gist folders:
  - ➕ Add a new note to the gist
  - 🗑️ Delete the entire gist
- Clean, hierarchical view of your gist collection

### 🔐 GitHub Integration

- **OAuth Authentication**: Secure sign-in using VS Code's built-in GitHub auth
- **Persistent Sessions**: Stay signed in across VS Code restarts
- **Status Bar Integration**: Shows auth state, last refresh time, and quick actions
- **Rate Limit Protection**: Configurable refresh intervals to prevent hitting GitHub API limits
- **Output Channel**: Detailed logging for troubleshooting sync issues

### ⚙️ Configuration

All settings are available via VS Code Settings (`Cmd/Ctrl+,`):

- **Storage Path** (`scratch.storagePath`): Global folder for storing gists (default: `~/scratch`)
- **Auto-Refresh** (`scratch.gistAutoRefreshMinutes`): Auto-refresh interval
  - Options: 0 (disabled), 5, 10, 15, 20, 25, 30 minutes
  - Default: 15 minutes
- **Folder Watching** (`scratch.watchScratchFolder`): Enable/disable file change detection
- **Auto-Create** (`scratch.autoCreateScratchFolder`): Auto-create scratch folder on startup

## 🚀 Quick Start

1. **Install Extension**: Search for "Scratchpad" in VS Code Extensions
2. **Sign In**: Click "Scratch: Sign in" in the status bar
3. **Sync Gists**: Click the sync icon in the Scratch sidebar
4. **Create Note**: Click the + icon to create your first note

## 📋 Commands

Access via Command Palette (`Cmd/Ctrl+Shift+P`):

- `Scratch: Sign In to GitHub` - Authenticate with GitHub
- `Scratch: Sign Out of GitHub` - Remove GitHub session
- `Scratch: Sync GitHub Gists` - Import selected gists from GitHub
- `Scratch: Refresh Imported Gists` - Update all imported gists
- `Scratch: Create Note` - Create a new note/gist
- `Scratch: Open in Browser` - Open the selected note gist on GitHub
- `Scratch: Show GitHub Status` - View current authentication status
- `Scratch: Refresh Scratch State` - Reload extension state

## 🎯 Usage Tips

- **Inline Actions**: Hover over gist folders or notes to see available actions
- **Auto-Refresh**: Set to 15-30 minutes for regular sync without excessive API calls
- **Flat View**: Use for quick note access when you have many gists
- **Grouped View**: Use for organizing notes by project/topic (each gist = one topic)

## 🔧 Troubleshooting

- **Notes not syncing?** Check the Output panel (View > Output > Scratch) for errors
- **Rate limit errors?** Increase the auto-refresh interval or disable it
- **Gist not showing?** Ensure it contains at least one markdown file (.md)

## 📝 Note

- Only markdown files (`.md`, `.markdown`) are synced
- Gist descriptions become folder names in the grouped view
- File changes are debounced (5 seconds) before syncing to GitHub
- Multiple editors can share the same `scratch.storagePath`, but concurrent edits to the same note may overwrite each other
