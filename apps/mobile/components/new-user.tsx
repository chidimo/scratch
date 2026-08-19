import { useAuth } from '@/context/AuthContext';
import { Accent, Brand } from '@/constants/theme';
import { Octicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { CustomButton } from './form-elements/custom-button';
import { ThemedText } from './themed-text';

export const NewUser = () => {
  const { signIn, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.authContainer}>
        <View style={styles.logoBadge}>
          <Image
            source={require('assets/images/scratch-icon.png')}
            style={styles.logo}
          />
        </View>
        <ThemedText style={styles.title} lightColor="#fff" darkColor="#fff">
          Scratch
        </ThemedText>
        <ThemedText
          style={styles.subtitle}
          lightColor="rgba(255,255,255,0.75)"
          darkColor="rgba(255,255,255,0.75)"
        >
          Your ideas, everywhere. Synced straight to GitHub Gists.
        </ThemedText>

        <View style={styles.dots}>
          {Accent.map((color) => (
            <View key={color} style={[styles.dot, { backgroundColor: color }]} />
          ))}
        </View>

        <CustomButton
          variant="PRIMARY"
          containerStyle={styles.signInButton}
          onPress={signIn}
          title={
            <View style={styles.signInButtonContent}>
              <Octicons name="mark-github" size={20} color={Brand.teal} />
              <ThemedText
                style={styles.signInButtonText}
                lightColor={Brand.teal}
                darkColor={Brand.teal}
              >
                Sign in with GitHub
              </ThemedText>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.teal,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoBadge: {
    width: 128,
    height: 128,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: 20,
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 17,
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  signInButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  signInButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
