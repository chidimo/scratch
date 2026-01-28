import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signIn } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        if (params.code) {
          await signIn();
          router.replace('/(tabs)');
        } else {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(tabs)');
      }
    };

    handleCallback();
  }, [params, signIn, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 16 }}>Completing authentication...</Text>
    </View>
  );
}
