import { TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';
import { SettingsCard } from './settings-card';
import { useThemeColor } from '@/hooks/use-theme-color';

export const AppSettingsSection = () => {
  const { border, mutedText } = useThemeColor({}, ['border', 'mutedText']);

  return (
    <SettingsCard>
      <SectionTitle title="App Settings" icon="sliders" />
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
      <TouchableOpacity style={styles.settingItemLast}>
        <ThemedText style={styles.settingThemedText}>About</ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
          App version and information
        </ThemedText>
      </TouchableOpacity>
    </SettingsCard>
  );
};

const styles = {
  settingItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  settingItemLast: {
    paddingTop: 10,
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
