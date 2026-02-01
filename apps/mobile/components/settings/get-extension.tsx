import { Linking, StyleSheet, TouchableOpacity, } from "react-native";
import { SectionTitle } from "./section-title";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

export const GetExtension = () => {
    return (
        <ThemedView style={styles.section}>
            <SectionTitle title="Get the Scratch Extension" />
            <TouchableOpacity
                style={styles.extensionLinkButton}
                onPress={() => Linking.openURL('https://marketplace.visualstudio.com/items?itemName=scratch.scratch-vscode')}
            >
                <ThemedText style={styles.extensionLinkText}>
                    Get the VSCode Extension
                </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.extensionLinkButton}
                onPress={() => Linking.openURL('https://marketplace.visualstudio.com/items?itemName=scratch.scratch-vscode')}
            >
                <ThemedText style={styles.extensionLinkText}>
                    Open Open VSX Marketplace
                </ThemedText>
            </TouchableOpacity>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    section: {
        marginBottom: 20,
        paddingVertical: 8,
    },
    extensionLinkButton: {
        marginTop: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    extensionLinkText: {
        color: '#007AFF',
        fontSize: 15,
        fontWeight: '600',
    },
});