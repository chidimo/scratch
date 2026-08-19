import { useUserProfile } from '@/hooks/use-user-profile';
import { accentForId } from '@/constants/theme';
import { Image, Linking, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../themed-text';
import { SettingsCard } from './settings-card';

export const AccountSection = () => {
  const { data: user } = useUserProfile();

  if (!user) {
    return null;
  }

  const ringColor = accentForId(user.login);

  return (
    <SettingsCard style={styles.card}>
      <View
        style={[
          styles.avatarRing,
          { borderColor: ringColor },
        ]}
      >
        <Image
          source={{ uri: user.avatar_url }}
          style={styles.avatar}
          resizeMode="cover"
        />
      </View>
      <View style={styles.userDetails}>
        <ThemedText style={styles.userName} numberOfLines={1}>
          {user.name || user.login}
        </ThemedText>
        <TouchableOpacity
          onPress={() => {
            const profileUrl =
              user.html_url || `https://github.com/${user.login}`;
            Linking.openURL(profileUrl);
          }}
        >
          <ThemedText style={styles.userLogin} type="link">
            @{user.login}
          </ThemedText>
        </TouchableOpacity>
      </View>
    </SettingsCard>
  );
};

const styles = {
  card: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800' as const,
    marginBottom: 2,
  },
  userLogin: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
};
