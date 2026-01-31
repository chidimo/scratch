import { useAuth } from '@/context/AuthContext';
import { useGistOperations } from '@/hooks/use-gists';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function GistExample() {
  const { token, signIn } = useAuth();
  const {
    gists,
    isLoading,
    error,
    createGist,
    deleteGist,
    refreshGists,
    isMutating,
  } = useGistOperations(token);

  const handleCreateTestGist = () => {
    createGist.mutate({
      description: 'Test gist from mobile app',
      files: {
        'test.txt': {
          content:
            'Hello from mobile app! This is a test gist created using TanStack Query.',
        },
      },
    });
  };

  const handleDeleteGist = (gistId: string) => {
    Alert.alert('Delete Gist', 'Are you sure you want to delete this gist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGist.mutate(gistId),
      },
    ]);
  };

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Please sign in to view gists</Text>
        <Button title="Sign In" onPress={signIn} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Loading gists...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <Button title="Retry" onPress={() => refreshGists()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Gists ({gists.length})</Text>
        <View style={styles.buttonRow}>
          <Button
            title="Refresh"
            onPress={() => refreshGists()}
            disabled={isMutating}
          />
          <Button
            title="Create Test"
            onPress={handleCreateTestGist}
            disabled={isMutating}
          />
        </View>
      </View>

      <FlatList
        data={gists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gistItem}>
            <View style={styles.gistHeader}>
              <Text style={styles.gistTitle}>
                {item.description || 'Untitled Gist'}
              </Text>
              <Text style={styles.gistDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.gistFiles}>
              {Object.keys(item.files).length} files
            </Text>
            <View style={styles.gistActions}>
              <Button
                title="Delete"
                onPress={() => handleDeleteGist(item.id)}
                color="#ff4444"
              />
            </View>
          </View>
        )}
        refreshing={isMutating}
        onRefresh={() => refreshGists()}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.message}>No gists found</Text>
            <Button
              title="Create Test Gist"
              onPress={handleCreateTestGist}
              disabled={isMutating}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
  error: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#ff4444',
  },
  gistItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gistTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  gistDate: {
    fontSize: 12,
    color: '#666',
  },
  gistFiles: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  gistActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
