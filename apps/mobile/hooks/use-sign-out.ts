import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRouter } from 'expo-router';

export const useSignOut = () => {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    try {
      // Clear all React Query cache
      queryClient.clear();

      // Call the original signOut function
      if (auth.signOut) {
        await auth.signOut();
        router.replace('/');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, [auth, queryClient, router]);
};
