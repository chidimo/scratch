import { createGithubClient, GithubClientAdapter } from '@scratch/shared';
import { WebStorageKeys } from '../lib/constants';

let githubClientInstance: GithubClientAdapter | null = null;

const getStoredToken = () => {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  return sessionStorage.getItem(WebStorageKeys.GITHUB_TOKEN);
};

export const getGithubClient = (): GithubClientAdapter => {
  githubClientInstance ??= createGithubClient({
    getToken: getStoredToken,
    userAgent: 'ScratchWeb/1.0.0',
  });
  return githubClientInstance;
};
