# Scratch

A scratchpad for developers that keeps your notes in **private GitHub Gists**, so the same notes are available on the web, on your phone and inside VS Code. There is no Scratch server: your gists are the database.

## Apps

| App                                      | Stack                           | What it does                                                                                                                                             |
| ---------------------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web** (`apps/web`)                     | React, Vite, Tailwind, TipTap   | Browse gists as cards, create, edit with a rich-text editor (with a preview toggle), delete. Live at <https://scratch.chidiorji.com>.                    |
| **Mobile** (`apps/mobile`)               | Expo, React Native, Expo Router | Sign in with GitHub, search, create, edit markdown with preview, delete, light/dark/system theme.                                                        |
| **VS Code extension** (`apps/extension`) | TypeScript, VS Code API         | Gists as files in a local folder with two-way sync, flat and grouped tree views, auto-refresh, rename/add/delete. [Details](./apps/extension/README.md). |

Shared code (GitHub client, React Query hooks, types) lives in `libs/shared` and is used by web and mobile. `netlify/functions/github-token.ts` performs the OAuth code exchange so client secrets stay on the server.

- **VS Code Marketplace**: <https://marketplace.visualstudio.com/items?itemName=chidimo.scratch>
- **Open VSX Registry**: <https://open-vsx.org/extension/chidimo/scratch>

## Getting started

Requires Node 22+ and Yarn 1.

```bash
yarn install          # root workspace (web, mobile, shared, dev auth server)
```

| Task                         | Command          |
| ---------------------------- | ---------------- |
| Web app + local OAuth server | `yarn start:web` |
| Mobile (Expo dev server)     | `yarn start`     |
| Tests                        | `yarn test`      |
| Build the web app            | `yarn build`     |
| Format                       | `yarn format`    |

The extension is not part of the root workspace: `cd apps/extension && yarn install && yarn watch`.

### Configuration

Copy the `.env.example` next to each app (`apps/web`, `apps/mobile`) and fill in your GitHub OAuth app credentials. Client secrets belong on the server (Netlify environment variables), never in an `EXPO_PUBLIC_` or `VITE_` variable. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full setup, including the mobile token exchange.

## Development workflow

Work happens on short-lived branches that open pull requests into **`dev`**. A single release PR from `dev` into `main` runs CI (typecheck for every project, web build, extension compile, tests). See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md): setup and workflow
- [DEPLOYMENT.md](./DEPLOYMENT.md): web deployment, extension publishing, OAuth configuration
- [MONOREPO.md](./MONOREPO.md): Nx workspace layout
- [Extension changelog](./apps/extension/CHANGELOG.md)
- [FINDINGS.md](./FINDINGS.md), [IMPLEMENTATION.md](./IMPLEMENTATION.md), [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md): original research and plans, kept for history and not kept up to date

## Support

If you find this project helpful, you can support it at [buymeacoffee.com/chidimo](https://buymeacoffee.com/chidimo).

## License

MIT. See [LICENSE](./LICENSE).
