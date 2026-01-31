import { Image, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SectionTitle } from './section-title';
import { useUserProfile } from '@/hooks/use-user-profile';

export const AccountSection = () => {
  const { data: user } = useUserProfile();

  if (!user) {
    return null;
  }

  return (
    <ThemedView style={styles.section}>
      <SectionTitle title="Account" />
      <View style={styles.userInfo}>
        <View style={styles.userDetails}>
          <ThemedText style={styles.userLogin}>@{user.login}</ThemedText>
          <ThemedText style={styles.userName}>{user.name}</ThemedText>
          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
        </View>
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>
    </ThemedView>
  );
};

const styles = {
  section: {
    paddingVertical: 4,
  },
  userInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: 8,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 2,
  },
  userLogin: {
    fontSize: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginLeft: 16,
  },
};
