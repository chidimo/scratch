import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GitHubUser } from '../types';
import { GithubClientAdapter } from '../services/github-client';
import { GISTS_QUERY_KEY } from './use-gists';

export const USER_PROFILE_QUERY_KEY = 'user-profile';

type BaseUserHookOptions = {
  githubClient: GithubClientAdapter;
  enabled?: boolean;
  persistUser?: (user: GitHubUser) => Promise<void>;
};

export const useUserProfile = ({
  githubClient,
  enabled = true,
  persistUser,
}: BaseUserHookOptions) => {
  return useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async (): Promise<GitHubUser> => {
      const userData = await githubClient.getUserProfile();
      if (persistUser) {
        await persistUser(userData);
      }
      return userData;
    },
    enabled,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
};

export const useInvalidateUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [USER_PROFILE_QUERY_KEY] });
  };
};

export const useRefreshUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.refetchQueries({ queryKey: [USER_PROFILE_QUERY_KEY] });
  };
};

type LogoutOptions = {
  clearStorage?: () => void;
  onLogout?: () => void;
};

export const useLogoutUser = (options?: LogoutOptions) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.removeQueries({ queryKey: [USER_PROFILE_QUERY_KEY] });
    queryClient.removeQueries({ queryKey: [GISTS_QUERY_KEY] });
    options?.clearStorage?.();
    options?.onLogout?.();
  };
};
