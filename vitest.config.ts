import path from 'node:path';
import { defineConfig } from 'vitest/config';

const sharedAlias = {
  '@scratch/shared': path.resolve(__dirname, 'libs/shared/src/index.ts'),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: sharedAlias },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'shared',
          environment: 'jsdom',
          include: ['libs/shared/src/**/*.test.{ts,tsx}'],
        },
      },
      {
        resolve: { alias: sharedAlias },
        esbuild: { jsx: 'automatic' },
        test: {
          name: 'web',
          environment: 'jsdom',
          include: ['apps/web/src/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'netlify',
          environment: 'node',
          include: ['netlify/**/*.test.ts'],
        },
      },
    ],
  },
});
