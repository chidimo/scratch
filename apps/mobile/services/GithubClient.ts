import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { TOKEN_STORAGE_KEY } from '@/constants/app-constants';
import { createGithubClient, GithubClientAdapter } from '@scratch/shared';

let githubClientInstance: GithubClientAdapter | null = null;

export const getGithubClient = (): GithubClientAdapter => {
  githubClientInstance ??= createGithubClient({
    getToken: () => AsyncStorage.getItem(TOKEN_STORAGE_KEY),
    checkConnectivity: async () => {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected ?? false;
    },
    userAgent: 'ScratchApp/1.0.0',
  });
  return githubClientInstance;
};
