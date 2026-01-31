import { TouchableOpacity } from 'react-native';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';

export const AppSettingsSection = () => {
  return (
    <ThemedView style={styles.section}>
      <SectionTitle title="App Settings" />
      <TouchableOpacity style={styles.settingItem}>
        <ThemedText style={styles.settingThemedText}>Sync Settings</ThemedText>
        <ThemedText style={styles.settingDescription}>
          Configure synchronization options
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingItem}>
        <ThemedText style={styles.settingThemedText}>Export Data</ThemedText>
        <ThemedText style={styles.settingDescription}>
          Export all notes and settings
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingItem}>
        <ThemedText style={styles.settingThemedText}>About</ThemedText>
        <ThemedText style={styles.settingDescription}>
          App version and information
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingThemedText: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
};
