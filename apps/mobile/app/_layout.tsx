import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // staleTime: 2 * 60 * 1000, // 2 minutes,
      // gcTime: 2 * 60 * 1000, // 2 minutes cache time
    },
  },
});

export const unstable_settings = {
  anchor: 'index',
};

// Each screen applies the safe-area insets itself so full-bleed screens (the
// sign-in hero) can paint under the status and navigation bars.
function RootNavigator() {
  const colorScheme = useColorScheme();
  const { background: backgroundColor } = useThemeColor({}, ['background']);
  const insets = useSafeAreaInsets();
  const insetContent = {
    backgroundColor,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <StatusBar style="auto" />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false, contentStyle: insetContent }}
              />
              <Stack.Screen
                name="modal"
                options={{ presentation: 'modal', title: 'Modal' }}
              />
              <Stack.Screen
                name="auth/callback"
                options={{ headerShown: false, contentStyle: insetContent }}
              />
              <Stack.Screen
                name="note"
                options={{ headerShown: false, contentStyle: insetContent }}
              />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
