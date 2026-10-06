# Contributing to Scratchpad

Thank you for your interest in contributing to Scratchpad! This guide will help you get started with contributing to the VSCode extension, web application, and overall project.

## 🚀 Getting Started

### Prerequisites

- Node.js 22+ and Yarn 1 installed
- Git installed and configured
- VS Code installed (for extension development)
- GitHub account (for contributions)

### Project Structure

```
scratch/
├── apps/
│   ├── extension/         # VS Code extension (own yarn.lock, not in the root workspace)
│   ├── mobile/            # Expo / React Native app
│   ├── web/               # React + Vite web app
│   └── dev-auth-server/   # Local OAuth helper for web development
├── libs/shared/           # GitHub client, React Query hooks, types
├── netlify/functions/     # github-token: server-side OAuth code exchange
└── test-utils/            # Small render helpers used by tests
```

### Development Setup

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/scratch.git
   cd scratch
   ```

2. **Install dependencies**

   ```bash
   yarn install                                   # web, mobile, shared, dev auth server
   (cd apps/extension && yarn install)            # extension has its own lockfile
   ```

3. **Run things**
   ```bash
   yarn start:web                                 # web app + local OAuth server
   yarn start                                     # mobile (Expo)
   (cd apps/extension && yarn watch)              # extension
   ```

## 📝 Development Guidelines

### Code Style

Prettier formats the repo and ESLint is configured per app.

```bash
yarn format            # write formatting
yarn format:check      # check formatting
yarn lint              # mobile lint
yarn lint:web          # web lint
```

### Tests and type checks

```bash
yarn test                                          # Vitest: shared, web, mobile services, netlify
npx tsc --noEmit -p apps/web/tsconfig.app.json     # typecheck one project
```

Typecheck each project against its own tsconfig (`apps/mobile`, `apps/web/tsconfig.app.json`, `libs/shared/tsconfig.lib.json`, `netlify`, `apps/dev-auth-server`, `apps/extension`); the root tsconfig mis-resolves the mobile `@/` alias.

### Pull requests

Branch from `dev` and open the PR **into `dev`**. Releases are a single PR from `dev` into `main`, which is when CI runs (typecheck, web build, extension compile, tests). Run the same checks locally before merging into `dev`.

### Commit Messages

Follow conventional commit format:

```
type(scope): description

feat(extension): add new note creation feature
fix(web): resolve authentication issue
docs(readme): update installation instructions
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, dependency updates

### Branch Naming

```
feature/description-of-feature
fix/description-of-fix
docs/update-documentation
```

## 🧰 Development Workflows

### VSCode Extension Development

#### Setup

```bash
cd apps/extension
npm install
npm run watch
```

#### Testing

```bash
# Run tests
npm test

# Run extension in development
# Open VSCode, go to Run and Debug, select "Run Extension"
```

#### Key Files

- `src/extension.ts` - Main extension entry point
- `src/views/` - Tree view providers
- `src/services/` - GitHub API integration
- `src/utils/` - Utility functions
- `package.json` - Extension manifest and commands

#### Adding New Commands

1. Add command to `package.json` under `contributes.commands`
2. Register command in `src/extension.ts`
3. Implement command handler function
4. Add tests for the command

### Web Application Development

#### Setup

```bash
cd apps/web
npm install
npm run dev
```

#### Testing

```bash
# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

#### Key Files

- `pages/` - Next.js pages
- `components/` - React components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions and configurations
- `styles/` - CSS/styled-components

### Mobile App Development

#### Setup

```bash
cd apps/mobile
npm install
# For iOS
npm run ios
# For Android
npm run android
```

#### Testing

```bash
# Run tests
npm test

# Run on simulator/device
npm run start
```

## 🐛 Bug Reports

### Creating Bug Reports

1. **Use the bug report template** in GitHub Issues
2. **Include:**
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, VSCode version, etc.)
   - Screenshots if applicable
   - Relevant logs or error messages

### Bug Report Template

```markdown
## Bug Description

Brief description of the issue

## Steps to Reproduce

1. Step one
2. Step two
3. Step three

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- OS: [e.g., macOS 13.0]
- VSCode version: [e.g., 1.82.0]
- Extension version: [e.g., 0.2.0]

## Additional Context

Any other relevant information
```

## ✨ Feature Requests

### Proposing Features

1. **Check existing issues** to avoid duplicates
2. **Use the feature request template**
3. **Include:**
   - Clear problem statement
   - Proposed solution
   - Alternative approaches considered
   - Use cases and benefits

### Feature Request Template

```markdown
## Feature Description

Clear description of the proposed feature

## Problem Statement

What problem does this solve?

## Proposed Solution

How should this work?

## Alternatives Considered

Other approaches you've thought about

## Use Cases

How would users benefit from this?
```

## 🔧 Code Contributions

### Pull Request Process

1. **Create a new branch** from `main`
2. **Make your changes** following the guidelines
3. **Test thoroughly** including edge cases
4. **Update documentation** if needed
5. **Submit a pull request** with clear description
6. **Address feedback** from maintainers
7. **Get approval** and merge

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Manual testing completed
- [ ] Edge cases considered

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Code Review Guidelines

#### For Reviewers

- Be constructive and respectful
- Focus on code quality, not personal style
- Explain reasoning for suggestions
- Check for edge cases and security issues
- Verify tests are adequate

#### For Contributors

- Respond to feedback promptly
- Explain complex code changes
- Accept constructive criticism
- Update code based on suggestions
- Ask questions if unclear

## 📱 Platform-Specific Guidelines

### VSCode Extension

- Follow VSCode Extension API guidelines
- Use proper TypeScript types
- Handle errors gracefully
- Provide user feedback via notifications
- Test with different VSCode versions

### Web Application

- Follow React and Next.js best practices
- Ensure responsive design
- Optimize for performance
- Consider accessibility (a11y)
- Test across browsers

### Mobile Application

- Follow React Native guidelines
- Consider platform differences (iOS/Android)
- Optimize for performance and battery
- Test on various screen sizes
- Handle network connectivity issues

## 🧪 Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Cover edge cases and error conditions
- Aim for high code coverage

### Integration Tests

- Test component interactions
- Test API integrations
- Test user workflows
- Use realistic test data

### E2E Tests

- Test complete user journeys
- Test across different platforms
- Include accessibility tests
- Test performance under load

### Test Structure

```
src/
├── components/
│   └── ComponentName.test.tsx
├── hooks/
│   └── hookName.test.ts
├── utils/
│   └── utilName.test.ts
└── e2e/
    └── user-journey.spec.ts
```

## 📚 Documentation

### Updating Documentation

- Keep README files up to date
- Document new features in relevant docs
- Update API documentation
- Add code comments for complex logic
- Include examples in documentation

### Documentation Types

- **README.md** - Project overview and quick start
- **API docs** - Function and component documentation
- **Guides** - Step-by-step instructions
- **Changelog** - Version history and changes

## 🤝 Community Guidelines

### Code of Conduct

Be respectful, inclusive, and professional:

- Welcome newcomers and help them learn
- Respect different viewpoints and experiences
- Focus on constructive feedback
- Avoid personal attacks or harassment
- Report inappropriate behavior to maintainers

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and discussions
- **Discord/Slack** - Real-time chat (if available)
- **Email** - Private or sensitive matters

### Getting Help

- Check existing documentation and issues
- Search for similar problems first
- Provide clear, detailed questions
- Include relevant code and error messages
- Be patient and respectful

## 🏆 Recognition

### Contributor Recognition

- Contributors listed in README
- Special thanks in release notes
- Contributor badges on GitHub
- Invitation to core team for significant contributions

### Types of Contributions

- Code contributions (bug fixes, features)
- Documentation improvements
- Bug reports and testing
- Community support and mentoring
- Design and UX improvements

## 📋 Release Process

### Version Management

- Follow semantic versioning (SemVer)
- Update changelog for each release
- Tag releases in Git
- Update documentation as needed

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog updated
- [ ] Release notes prepared
- [ ] Deployment tested

## 🔒 Security

### Reporting Security Issues

- Do not report security issues in public
- Email maintainers directly
- Provide detailed vulnerability information
- Wait for confirmation before disclosing

### Security Best Practices

- Keep dependencies updated
- Use secure coding practices
- Test for common vulnerabilities
- Review code for security issues
- Follow platform-specific security guidelines

## 📞 Getting Help

If you need help with contributing:

1. **Check existing documentation** and issues
2. **Join community discussions** if available
3. **Create an issue** with the "question" label
4. **Contact maintainers** directly for sensitive matters

Thank you for contributing to Scratchpad! 🎉
