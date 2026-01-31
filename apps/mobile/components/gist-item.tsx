import { Note } from '@scratch/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedView } from './themed-view';

export const GistItem = ({ gist }: { gist: Note }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => router.push(`/note/${gist.id}`)}
    >
      <ThemedView style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{gist.title}</Text>
        <Text style={styles.noteDate}>
          {new Date(gist.updated_at).toLocaleDateString()}
        </Text>
      </ThemedView>
      <Text style={styles.notePreview} numberOfLines={3}>
        {gist.content.substring(0, 150)}...
      </Text>
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
          <Text style={styles.statusText}>{gist.sync_status}</Text>
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
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  noteItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  notePreview: {
    fontSize: 14,
    color: '#333',
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
    color: '#666',
    textTransform: 'capitalize',
  },
});
