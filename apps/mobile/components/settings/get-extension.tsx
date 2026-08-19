import { Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { SectionTitle } from './section-title';
import { SettingsCard } from './settings-card';

export const GetExtension = () => {
  return (
    <SettingsCard>
      <SectionTitle title="Get the Extension" icon="download" />
      <TouchableOpacity
        style={styles.extensionLinkButton}
        onPress={() => Linking.openURL('https://scratch.chidiorji.com')}
      >
        <ThemedText style={styles.extensionLinkText} type="link">
          On the web
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.extensionLinkButton}
        onPress={() =>
          Linking.openURL('https://open-vsx.org/extension/chidimo/scratch')
        }
      >
        <ThemedText style={styles.extensionLinkText} type="link">
          Open VSX Registry
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.extensionLinkButton}
        onPress={() =>
          Linking.openURL(
            'https://marketplace.visualstudio.com/items?itemName=chidimo.scratch',
          )
        }
      >
        <ThemedText style={styles.extensionLinkText} type="link">
          VSCode Marketplace
        </ThemedText>
      </TouchableOpacity>
    </SettingsCard>
  );
};

const styles = StyleSheet.create({
  extensionLinkButton: {
    paddingVertical: 6,
  },
  extensionLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
