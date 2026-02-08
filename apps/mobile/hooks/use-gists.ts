import AsyncStorage from '@react-native-async-storage/async-storage';
import { GISTS_STORAGE_KEY } from '@/constants/app-constants';
import { useAuth } from '@/context/AuthContext';
import { getGithubClient } from '@/services/GithubClient';
import {
  useCreateGist as useSharedCreateGist,
  useDeleteGistById as useSharedDeleteGistById,
  useGistById as useSharedGistById,
  useGists as useSharedGists,
  useRefreshGists as useSharedRefreshGists,
  useUpdateGistById as useSharedUpdateGistById,
  useUpdateGistFileContent as useSharedUpdateGistFileContent,
} from '@scratch/shared';

export const useGists = ({ searchTerm }: { searchTerm?: string }) => {
  const { token } = useAuth();
  return useSharedGists({
    searchTerm,
    githubClient: getGithubClient(),
    enabled: !!token,
  });
};

export const useCreateGist = () => {
  return useSharedCreateGist({ githubClient: getGithubClient() });
};

export const useUpdateGistById = () => {
  return useSharedUpdateGistById({ githubClient: getGithubClient() });
};

export const useUpdateGistFileContent = () => {
  return useSharedUpdateGistFileContent({ githubClient: getGithubClient() });
};

export const useDeleteGistById = () => {
  return useSharedDeleteGistById({ githubClient: getGithubClient() });
};

export const useRefreshGists = () => {
  return useSharedRefreshGists({
    githubClient: getGithubClient(),
    persistGists: (gists) =>
      AsyncStorage.setItem(GISTS_STORAGE_KEY, JSON.stringify(gists)),
  });
};

export const useGistById = (
  id: string | null,
  options?: { enabled?: boolean },
) => {
  const { token } = useAuth();
  const isEnabled = options?.enabled ?? true;
  return useSharedGistById(id, {
    githubClient: getGithubClient(),
    enabled: !!id && !!token && isEnabled,
  });
};
