import { Alert, TouchableOpacity } from 'react-native';
import { getGithubClient } from '@/services/GithubClient';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';

export const GitHubApiSection = () => {
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
    <ThemedView style={styles.section}>
      <SectionTitle title="GitHub API" />
      <TouchableOpacity
        style={styles.settingItem}
        onPress={handleCheckRateLimit}
      >
        <ThemedText style={styles.settingThemedText}>
          Check Rate Limit
        </ThemedText>
        <ThemedText style={styles.settingDescription}>
          View GitHub API usage
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = {
  section: {
    paddingVertical: 4,
  },
  settingItem: {
    paddingVertical: 12,
  },
  settingThemedText: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
};
