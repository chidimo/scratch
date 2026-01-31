import { useGists } from '@/hooks/use-gists';
import { Note } from '@scratch/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { GistItem } from './gist-item';
import { SearchInput } from './search-input';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export const GistList = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const { data: gists, refetch, isPending } = useGists(searchTerm);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCreateNote = () => {
    router.push('/note/new');
  };

  const renderNoteItem = ({ item }: { item: Note }) => <GistItem gist={item} />;

  return (
    <ThemedView style={styles.container}>
      {isPending && <ActivityIndicator size="large" />}
      <View style={styles.searchAndCreateContainer}>
        <View style={styles.searchWrapper}>
          <SearchInput onSearch={handleSearch} />
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateNote}
        >
          <ThemedText style={styles.createButtonThemedText}>+ New</ThemedText>
        </TouchableOpacity>
      </View>
      <FlatList
        data={gists}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>
              {searchTerm.trim() ? 'No notes found' : 'No notes yet'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {searchTerm.trim()
                ? `Try searching for something else`
                : 'Create your first note to get started'}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {searchTerm.trim() ? 'Search Results' : 'My Notes'}
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
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
  searchAndCreateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchWrapper: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
  },
  createButtonThemedText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
