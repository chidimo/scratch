import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Octicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { CustomButton } from './form-elements/custom-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

export const NewUser = () => {
  const { signIn, isLoading: authLoading } = useAuth();
  const { mutedText, onTint, tint } = useThemeColor({}, [
    'mutedText',
    'onTint',
    'tint',
  ]);

  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tint} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.authContainer}>
        <Image
          source={require('assets/images/scratch-icon.png')}
          style={styles.logo}
        />
        <ThemedText style={styles.title} type="title">
          Welcome to Scratch (Gists)
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: mutedText }]}>
          Your personal scratchpad synced with GitHub Gists
        </ThemedText>
        <CustomButton
          variant="PRIMARY"
          containerStyle={styles.signInButton}
          onPress={signIn}
          title={
            <View style={styles.signInButtonContent}>
              <Octicons name="mark-github" size={20} color={onTint} />
              <ThemedText
                style={[styles.signInButtonText, { color: onTint }]}
              >
                Sign in with GitHub
              </ThemedText>
            </View>
          }
        />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
  },
  title: {
    fontSize: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  signInButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
