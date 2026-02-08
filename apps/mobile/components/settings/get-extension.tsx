import { Linking, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { SectionTitle } from './section-title';

export const GetExtension = () => {
  return (
    <ThemedView style={styles.section}>
      <SectionTitle title="Get the Scratch (Gists) Extension" />
      <TouchableOpacity
        style={styles.extensionLinkButton}
        onPress={() =>
          Linking.openURL(
            'https://marketplace.visualstudio.com/items?itemName=chidimo.scratch',
          )
        }
      >
        <ThemedText style={styles.extensionLinkText}>
          VSCode Marketplace
        </ThemedText>
      </TouchableOpacity>

      {/* <TouchableOpacity
                style={styles.extensionLinkButton}
                onPress={() => Linking.openURL('https://marketplace.visualstudio.com/items?itemName=scratch.scratch-vscode')}
            >
                <ThemedText style={styles.extensionLinkText}>
                    Open VSX Marketplace
                </ThemedText>
            </TouchableOpacity> */}

      <TouchableOpacity
        style={styles.extensionLinkButton}
        onPress={() => Linking.openURL('https://scratch.chidiorji.com')}
      >
        <ThemedText style={styles.extensionLinkText}>On the web</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingVertical: 4,
  },
  extensionLinkButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  extensionLinkText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
