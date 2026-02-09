import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useInvalidateUserProfile as useSharedInvalidateUserProfile,
  useRefreshUserProfile as useSharedRefreshUserProfile,
  useUserProfile as useSharedUserProfile,
} from '@scratch/shared';
import { useAuth } from '@/context/AuthContext';
import { getGithubClient } from '@/services/GithubClient';
import { USER_STORAGE_KEY } from '@/constants/app-constants';

export const useUserProfile = () => {
  const { token } = useAuth();
  return useSharedUserProfile({
    githubClient: getGithubClient(),
    enabled: !!token,
    persistUser: (user) =>
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
  });
};

export const useInvalidateUserProfile = () => {
  return useSharedInvalidateUserProfile();
};

export const useRefreshUserProfile = () => {
  return useSharedRefreshUserProfile();
};
