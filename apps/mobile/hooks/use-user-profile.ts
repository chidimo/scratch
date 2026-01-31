import { useAuth } from '@/context/AuthContext';
import { getGithubClient } from '@/services/GithubClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GitHubUser } from '@scratch/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { USER_STORAGE_KEY } from '@/constants/app-constants';

// Query key for user profile
const USER_PROFILE_QUERY_KEY = 'user-profile';

// Hook to fetch user profile
export const useUserProfile = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: [USER_PROFILE_QUERY_KEY],
    queryFn: async (): Promise<GitHubUser> => {
      const githubClient = getGithubClient();
      const userData = await githubClient.getUserProfile();

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      return userData;
    },
    enabled: !!token, // Only run query when auth is loaded and token exists
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
