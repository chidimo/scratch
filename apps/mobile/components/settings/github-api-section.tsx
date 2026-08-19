import { Alert, TouchableOpacity } from 'react-native';
import { getGithubClient } from '@/services/GithubClient';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';
import { SettingsCard } from './settings-card';
import { useThemeColor } from '@/hooks/use-theme-color';

export const GitHubApiSection = () => {
  const { mutedText } = useThemeColor({}, ['mutedText']);

  const handleCheckRateLimit = async () => {
    try {
      const githubClient = getGithubClient();
      const rateLimit = await githubClient.getRateLimitStatus();
      Alert.alert(
        'GitHub API Rate Limit',
        `Remaining: ${rateLimit.remaining}\nLimit: ${rateLimit.limit}\nResets: ${new Date(rateLimit.reset * 1000).toLocaleString()}`,
      );
    } catch {
      Alert.alert('Error', 'Failed to fetch rate limit status');
    }
  };

  return (
    <SettingsCard>
      <SectionTitle title="GitHub API" icon="zap" />
      <TouchableOpacity
        style={styles.settingItem}
        onPress={handleCheckRateLimit}
      >
        <ThemedText style={styles.settingThemedText}>
          Check Rate Limit
        </ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
          View GitHub API usage
        </ThemedText>
      </TouchableOpacity>
    </SettingsCard>
  );
};

const styles = {
  settingItem: {
    paddingVertical: 4,
  },
  settingThemedText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  },
};
