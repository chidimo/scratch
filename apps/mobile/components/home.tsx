import { useAuth } from '@/context/AuthContext';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ActivityIndicator } from 'react-native';
import { NewUser } from './new-user';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export const Home = () => {
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const { data: user, isPending: userLoading } = useUserProfile();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/gists');
    }
  }, [router, user]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" />
        <ThemedText style={{ textAlign: 'center', marginTop: 16 }}>
          Setting up...
        </ThemedText>
      </ThemedView>
    );
  }

  // Show loading while user profile is being fetched (only when token exists)
  if (token && userLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" />
        <ThemedText style={{ textAlign: 'center', marginTop: 16 }}>
          Loading profile...
        </ThemedText>
      </ThemedView>
    );
  }

  return <NewUser />;
};
