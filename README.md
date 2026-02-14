# Developer Scratchpad

A cross-platform scratchpad system for developers to capture ideas on the go, with seamless sync between mobile and VSCode.

## � Documentation

- **[Deployment Guide](./DEPLOYMENT.md)** - Extension publishing and web deployment instructions
- **[Contribution Guide](./CONTRIBUTING.md)** - How to contribute to the project
- **[Implementation Plans](./IMPLEMENTATION.md)** - Technical findings and implementation details
- **[Extension Changelog](./apps/extension/CHANGELOG.md)** - VSCode extension version history

## �🚀 Project Overview

This project solves the common developer problem of losing great ideas while away from the keyboard. It provides:

- **Mobile App**: Capture ideas instantly with your phone
- **VSCode Extension**: Access and edit notes while coding
- **GitHub Integration**: Sync via private GitHub Gists
- **Team Support**: Encrypted scratch files in team repositories

## 📋 Key Features

- ✅ **Cross-platform sync** between mobile and desktop
- ✅ **Privacy-first** with AES-256 encryption
- ✅ **GitHub Gists** for personal note storage
- ✅ **Team collaboration** with encrypted .scratch folders
- ✅ **Offline support** with automatic sync
- ✅ **Rich text editing** with markdown support

## 🔌 VSCode Extension Features

### 📝 Note Management

- **Create Notes**: Create new notes that automatically sync as GitHub Gists
- **Add to Gist**: Add additional notes to existing gists
- **Delete Notes**: Remove individual notes with automatic GitHub sync
- **Rename Notes**: Rename notes locally and on GitHub simultaneously
- **Delete Gists**: Remove entire gists and all their notes

### 🔄 Sync & Auto-Refresh

- **Manual Sync**: Import selected GitHub Gists into your workspace
- **Auto-Refresh**: Configurable auto-refresh (5, 10, 15, 20, 25, or 30 minutes)
- **Smart Filtering**: Only shows unimported gists when syncing
- **Two-Way Sync**: Local changes automatically push to GitHub
- **File Watching**: Detects file changes and syncs in the background
- **Empty Folder Cleanup**: Automatically removes empty gist folders

### 📊 Two View Modes

- **Flat View (Notes)**: See all your notes in a single list
  - Quick access with filename and gist ID
  - Inline delete and rename actions
- **Grouped View (Gists)**: Notes organized by gist ID
  - Collapsible gist folders
  - Add note or delete gist actions on folders
  - Clean hierarchical structure

### 🔐 GitHub Integration

- **OAuth Authentication**: Secure sign-in with GitHub
- **Session Management**: Persistent sessions across restarts
- **Status Indicator**: Status bar shows auth state and last refresh
- **Rate Limit Protection**: Configurable refresh intervals to avoid API limits

### ⚙️ Configuration Options

- **Storage Path**: Customize where gists are stored (default: `~/.scratch`)
- **Auto-Refresh Interval**: Choose from 0 (disabled), 5, 10, 15, 20, 25, or 30 minutes
- **Folder Watching**: Enable/disable automatic file change detection
- **Auto-Create Folder**: Automatically create scratch folder on startup

### 🎯 Quick Actions

- **Inline Icons**: Hover over items to see available actions
- **Context Menus**: Right-click for additional options
- **Command Palette**: Access all commands via `Cmd/Ctrl+Shift+P`
- **Status Bar**: Click to refresh gists or sign in

## 📚 Documentation

- **[Technical Findings](./FINDINGS.md)** - Detailed technical feasibility analysis
- **[Implementation Plan](./IMPLEMENTATION_PLAN.md)** - Complete development roadmap

## 🔗 Links

- **VS Code Marketplace**: <https://marketplace.visualstudio.com/items?itemName=chidimo.scratch>
- **Open VSX Registry**: <https://open-vsx.org/extension/chidimo/scratch>

## 🛠️ Tech Stack

### Mobile App

- React Native with Expo
- GitHub OAuth integration
- AsyncStorage for offline caching

### VSCode Extension

- TypeScript with VSCode Extension API
- AES-256 encryption for security
- Git integration for team workflows

## 🚀 Quick Start

Here's the quick start guide for the project.

### Mobile App (Expo Go)

```bash
npm install
npx expo start
```

## 📅 Development Timeline

- **Phase 1**: Mobile App MVP (2-3 weeks)
- **Phase 2**: VSCode Extension (2-3 weeks)
- **Phase 3**: Integration & Testing (1-2 weeks)
- **Phase 4**: Deployment (1 week)

Total estimated timeline: **6-8 weeks**

## 🤝 Contributing

See [Implementation Plan](./IMPLEMENTATION_PLAN.md) for detailed development roadmap and contribution guidelines.

## ☕ Support

If you find this project helpful, you can support it here:
[buymeacoffee.com/chidimo](https://buymeacoffee.com/chidimo)

## 📄 License

MIT License - see LICENSE file for details.
