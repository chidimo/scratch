import { useGists } from '@/hooks/use-gists';
import { useThemeColor } from '@/hooks/use-theme-color';
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
  const { mutedText, tint } = useThemeColor({}, ['mutedText', 'tint']);

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
      {isPending && <ActivityIndicator size="large" color={tint} />}

      <View style={styles.topSection}>
        <View style={styles.searchAndCreateContainer}>
          <View style={styles.searchWrapper}>
            <SearchInput onSearch={handleSearch} />
          </View>

          <NewNoteButton />
        </View>
      </View>
      <FlatList
        data={gists}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tint}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>
              {searchTerm?.trim() ? 'No notes found' : 'No notes yet'}
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: mutedText }]}>
              {searchTerm?.trim()
                ? `Try searching for something else`
                : 'Create your first note to get started'}
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
    paddingHorizontal: 16,
  },
  topSection: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  searchAndCreateContainer: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
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
