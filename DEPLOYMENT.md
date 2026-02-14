# Deployment Guide

This guide covers deployment processes for both the VSCode extension and the web application.

## 📦 VSCode Extension Publishing

### Prerequisites

- Node.js 18+ installed
- VS Code Extension CLI (`vsce`) installed globally
- Access tokens for publishing platforms:
  - `VSCE_PAT` - Visual Studio Code Marketplace Personal Access Token
  - `OVSX_TOKEN` - Open VSX Registry Token

### Environment Setup

```bash
# Install dependencies
npm install

# Install VSCE globally
npm install -g @vscode/vsce

# Install OVSX globally
npm install -g ovsx
```

### Publishing Process

#### 1. Build Extension

```bash
# Compile TypeScript
npm run compile

# Or build and watch during development
npm run watch
```

#### 2. Package Extension

```bash
# Create VSIX package
npm run package

# Clean previous builds
npm run package:clean

# Build and package in one step
npm run package:with-build
```

#### 3. Publish to Marketplaces

```bash
# Publish to VS Code Marketplace
npm run publish:vsce

# Publish to Open VSX Registry
npm run publish:ovsx

# Publish to both marketplaces
npm run publish:all
```

### Environment Variables

Set these environment variables before publishing:

```bash
export VSCE_PAT="your_vsce_personal_access_token"
export OVSX_TOKEN="your_ovsx_token"
```

### Version Management

1. Update `package.json` version number
2. Update `CHANGELOG.md` with release notes
3. Commit changes with version tag
4. Run publishing commands

### Troubleshooting

- **Authentication errors**: Verify tokens are correctly set and have proper permissions
- **Package size errors**: Ensure `node_modules` is excluded in `.vscodeignore`
- **Validation errors**: Run `vsce ls` to check package before publishing

## 🌐 Web Application Deployment

### Prerequisites

- Access to web hosting platform (Vercel, Netlify, AWS, etc.)
- Domain name configured (optional)
- Environment variables for API keys and secrets

### Deployment Platforms

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
```

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
netlify build
netlify deploy --prod
```

#### AWS S3 + CloudFront

1. Build the application
2. Upload to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain and SSL

### Environment Configuration

Required environment variables for web app:

```bash
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_nextauth_secret
```

### CI/CD Integration

#### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### Monitoring and Analytics

- Set up error tracking (Sentry, Bugsnag)
- Configure analytics (Google Analytics, Plausible)
- Monitor API rate limits and usage
- Set up uptime monitoring

### Security Considerations

- Use HTTPS in production
- Secure all environment variables
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

## 🔄 Release Process

### Extension Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with release notes
- [ ] Test extension functionality
- [ ] Run `npm run lint` to check code quality
- [ ] Build extension: `npm run compile`
- [ ] Package extension: `npm run package`
- [ ] Test VSIX package locally
- [ ] Publish to marketplaces
- [ ] Create GitHub release with VSIX file
- [ ] Update documentation

### Web App Release Checklist

- [ ] Update version in package files
- [ ] Update changelog
- [ ] Run tests: `npm test`
- [ ] Build application: `npm run build`
- [ ] Test production build locally
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Monitor for issues

## 📊 Performance Monitoring

### Key Metrics

- Extension download and activation rates
- Web app page load times
- API response times
- Error rates and types
- User engagement metrics

### Tools

- **VSCode**: Extension analytics dashboard
- **Web**: Google Analytics, Vercel Analytics
- **API**: Custom monitoring dashboard
- **Errors**: Sentry, LogRocket

## 🆘 Support and Rollbacks

### Extension Rollback

- Publish previous version as new release if critical issues
- Use VSCode's built-in update mechanisms
- Communicate issues to users via GitHub

### Web App Rollback

- Use platform-specific rollback features
- Maintain previous builds for quick rollback
- Implement feature flags for gradual rollouts

### Communication

- GitHub Issues for bug reports
- Discord/Slack for real-time communication
- Email announcements for major updates
- In-app notifications for critical issues
