import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GitHubUser } from '@scratch/shared';
import { getGithubClient } from '@/services/GithubClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Query key for user profile
export const USER_PROFILE_QUERY_KEY = 'userProfile';

// Hook to fetch user profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async (): Promise<GitHubUser> => {
      const githubClient = getGithubClient();
      const userData = await githubClient.getUserProfile();

      console.log(userData);

      await AsyncStorage.setItem('github_user', JSON.stringify(userData));

      return userData;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - user profile changes less frequently
    gcTime: 1000 * 60 * 30, // 30 minutes cache time
  });
};

// Hook to invalidate user profile cache
export const useInvalidateUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [USER_PROFILE_QUERY_KEY] });
  };
};

// Hook to refresh user profile
export const useRefreshUserProfile = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.refetchQueries({ queryKey: [USER_PROFILE_QUERY_KEY] });
  };
};
