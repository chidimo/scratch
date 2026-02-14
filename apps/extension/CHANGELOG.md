# Changelog

All notable changes to the Scratchpad VSCode Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enhanced documentation structure with deployment, contributing, and implementation guides
- Centralized constants management in `constants.ts`
- Rate limit protection with increased debounce timing (5000ms)
- Enhanced error messages and user feedback

### Changed

- Default auto-refresh interval increased to 30 minutes
- Local-first approach for delete/rename operations
- Better GitHub API rate limit handling
- Improved code organization and maintainability

### Fixed

- Tree view collapse/expand functionality removed (due to VSCode API limitations)
- Command handler issues with tree item parameters
- Missing variable declarations and import issues
- ESLint configuration for VSCode module resolution

## [0.4.3] - 2024-02-14

### Added

- Comprehensive documentation structure
- Deployment guide for extension and web app
- Detailed contribution guidelines
- Technical implementation documentation

### Changed

- Updated README to focus on user-facing information
- Consolidated technical documentation into dedicated files
- Improved changelog format and structure

## [0.4.2] - 2024-02-05

### Fixed

- ESLint configuration for VSCode module resolution
- Import/export issues with constants
- Variable declaration problems
- TypeScript compilation errors

### Changed

- Centralized all hardcoded values into constants.ts
- Improved error message handling with constants
- Enhanced code maintainability

## [0.4.1] - 2024-02-05

### Fixed

- Command handler parameter issues for tree item actions
- Missing variable declarations
- Function scope problems
- Import statement organization

### Changed

- Improved delete and rename note functionality
- Better error handling for file operations
- Enhanced user feedback messages

## [0.4.0] - 2024-02-05

### Added

- Constants management system
- Enhanced rate limit protection
- Improved error messaging system
- Better code organization

### Changed

- Increased gist update debounce from 2000ms to 5000ms
- Default auto-refresh increased to 30 minutes
- Local-first approach for file operations
- Centralized all configuration values

### Fixed

- GitHub API rate limit issues
- Tree view command handling
- File operation reliability
- Extension performance under heavy usage

## [0.3.0] - 2024-02-03

### Added

- Enhanced tree view with inline actions
- Context menu support for files
- Improved file watching capabilities
- Better error handling and recovery

### Changed

- Optimized GitHub API usage
- Improved sync performance
- Enhanced user experience with better feedback

### Fixed

- File deletion and rename operations
- Tree view refresh issues
- Authentication state management
- Configuration loading problems

## [0.2.0] - 2024-02-05

### Added

- GitHub OAuth authentication integration
- Gist synchronization with GitHub API
- Dual view modes (Flat and Grouped)
- Tree view with inline actions
- File watching and auto-sync
- Status bar integration
- Configuration settings
- Markdown file filtering
- Rate limit protection
- Output channel for debugging

### Changed

- Improved error handling and user feedback
- Enhanced file system operations
- Better memory management and cleanup

### Fixed

- Authentication session persistence
- File change detection
- Tree view refresh issues
- Configuration loading problems

## [0.1.0] - 2024-01-XX

### Added

- Initial extension scaffold
- Scratch folder detection and creation
- Command palette actions for scratch workflows
- Basic file system integration
- Extension manifest and configuration

### Changed

- Project structure initialization
- Development environment setup

---

## Version Summary

### v0.1.0 - Foundation

- Basic extension structure
- Scratch folder management
- Command palette integration

### v0.2.0 - GitHub Integration

- Full GitHub OAuth authentication
- Gist synchronization capabilities
- Tree view with dual modes
- File watching and auto-sync
- Comprehensive configuration options

### v0.3.0 - Enhanced UX

- Improved tree view with inline actions
- Context menu support
- Better error handling and recovery
- Enhanced file watching capabilities

### v0.4.0 - Performance & Reliability

- Constants management system
- Enhanced rate limit protection (5000ms debounce)
- Local-first approach for file operations
- Improved error messaging system
- Better code organization

### v0.4.1 - Bug Fixes

- Fixed command handler parameter issues
- Resolved function scope problems
- Improved delete/rename functionality
- Enhanced user feedback messages

### v0.4.2 - Code Quality

- Fixed ESLint configuration
- Resolved import/export issues
- Centralized hardcoded values
- Enhanced code maintainability

### v0.4.3 - Documentation

- Comprehensive documentation structure
- Deployment and contribution guides
- Technical implementation documentation
- Improved README and changelog format

### Future Versions

- Collaboration features
- Advanced editing capabilities
- Performance optimizations
- Mobile app integration
