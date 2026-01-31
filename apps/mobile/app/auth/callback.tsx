import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { completeAuth, isLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback triggered with params:', params);

        if (isLoading || !isMounted.current || hasProcessed.current) {
          console.log(
            'Waiting for auth context, component not mounted, or already processed',
          );
          return;
        }

        if (params.code) {
          hasProcessed.current = true; // Mark as processed
          console.log('Processing OAuth callback with code...');
          if (completeAuth) {
            await completeAuth(params.code as string);
          }

          console.log('Auth completed successfully');
          if (isMounted.current) {
            router.replace('/');
          }
        } else if (params.error) {
          console.error('OAuth error:', params.error);
          setError(`Authentication error: ${params.error}`);
          if (isMounted.current) {
            setIsProcessing(false);
          }
        } else {
          console.error('No code or error parameter in callback');
          setError('Invalid callback response. Please try signing in again.');
          if (isMounted.current) {
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setError(
          `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        if (isMounted.current) {
          setIsProcessing(false);
        }
      }
    };

    if (!isLoading) {
      handleCallback();
    }
  }, [params, completeAuth, isLoading, router]);

  if (isProcessing || isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16, textAlign: 'center' }}>
          Completing authentication...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: '#d32f2f',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ fontSize: 14, color: 'white' }}>
            Go back to sign in
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
