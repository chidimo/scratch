# Release Checklist (Scratchpad VSCode Extension)

## Pre-release

- Update `version` in `apps/extension/package.json`
- Update `apps/extension/CHANGELOG.md`
- Run `yarn compile` in `apps/extension`
- Run `yarn lint` in `apps/extension`
- Run `yarn package:with-build` to generate a VSIX

## Publish (manual)

- VS Code Marketplace: `yarn publish:vsce`
- Open VSX: `yarn publish:ovsx`

## Publish (CI)

- Push a tag like `v0.1.1`
- Ensure GitHub secrets are set:
  - `VSCE_PAT`
  - `OVSX_TOKEN`

## Post-release

- Install from Marketplace + Open VSX and smoke test
