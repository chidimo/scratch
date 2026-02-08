import { useGists } from '@/hooks/use-gists';
import { Note } from '@scratch/shared';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { GistItem } from './gist-item';
import { SearchInput } from './search-input';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';
import { NewNoteButton } from './note/new-note-button';

export const GistList = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: gists, refetch, isPending } = useGists({ searchTerm });

  useFocusEffect(
    useCallback(() => {
      refetch();
      return undefined;
    }, [refetch]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const renderNoteItem = ({ item }: { item: Note }) => <GistItem gist={item} />;

  return (
    <ThemedView style={styles.container}>
      {isPending && <ActivityIndicator size="large" />}

      <View style={styles.searchAndCreateContainer}>
        <View style={styles.searchWrapper}>
          <SearchInput onSearch={handleSearch} />
        </View>

        <NewNoteButton />
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
              {searchTerm?.trim() ? 'No notes found' : 'No notes yet'}
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {searchTerm?.trim()
                ? `Try searching for something else`
                : 'Create your first note to get started'}
            </ThemedText>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {searchTerm?.trim() ? 'Search Results' : 'My Notes'}
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
    paddingHorizontal: 8,
  },
  searchAndCreateContainer: {
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchWrapper: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
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
    textAlign: 'center',
  },
});
