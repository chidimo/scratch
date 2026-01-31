import { Note } from '@scratch/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export const GistItem = ({ gist }: { gist: Note }) => {
  const router = useRouter();
  // console.log(gist)

  return (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => router.push(`/note/${gist.id}`)}
    >
      <ThemedView style={styles.noteHeader}>
        <ThemedText style={styles.noteTitle}>{gist.title}</ThemedText>
        <ThemedText style={styles.noteDate}>
          {new Date(gist.updated_at).toLocaleDateString()}
        </ThemedText>
      </ThemedView>
      <ThemedText style={styles.notePreview} numberOfLines={3}>
        {gist.content.substring(0, 500)}...
      </ThemedText>
      <ThemedView style={styles.noteFooter}>
        <View style={styles.syncStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  gist.sync_status === 'synced' ? '#4CAF50' : '#FF9800',
              },
            ]}
          />
          <ThemedText style={styles.statusText}>{gist.sync_status}</ThemedText>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  noteItem: {
    margin: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  notePreview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
});
