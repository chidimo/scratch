import { TouchableOpacity } from 'react-native';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';
import { useThemeColor } from '@/hooks/use-theme-color';

export const AppSettingsSection = () => {
  const { border, mutedText } = useThemeColor({}, ['border', 'mutedText']);

  return (
    <ThemedView style={styles.section}>
      <SectionTitle title="App Settings" />
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: border }]}
      >
        <ThemedText style={styles.settingThemedText}>Sync Settings</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
          Configure synchronization options
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: border }]}
      >
        <ThemedText style={styles.settingThemedText}>Export Data</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
          Export all notes and settings
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: border }]}
      >
        <ThemedText style={styles.settingThemedText}>About</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
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
  },
  settingThemedText: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
};
