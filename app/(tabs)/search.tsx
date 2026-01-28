import { useAuth } from "@/context/AuthContext";
import { githubClient, Note } from "@/services/GithubClient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = async () => {
    if (!searchQuery.trim() || !user) return;

    setIsLoading(true);
    try {
      const gists = await githubClient.getUserGists();

      const notes: Note[] = gists
        .filter(
          (gist) =>
            gist.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            Object.keys(gist.files).some((filename) =>
              filename.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        )
        .map((gist) => ({
          id: gist.id,
          title: gist.description || "Untitled Note",
          content: Object.values(gist.files)[0]?.content || "",
          created_at: gist.created_at,
          updated_at: gist.updated_at,
          tags: [],
          gist_id: gist.id,
          sync_status: "synced" as const,
        }));

      setSearchResults(notes);
    } catch (error) {
      console.error("Error searching gists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => router.push(`/note/${item.id}`)}
    >
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteDate}>
        {new Date(item.updated_at).toLocaleDateString()}
      </Text>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content.substring(0, 100)}...
      </Text>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to search your notes.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          style={styles.resultsList}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>
                No notes found matching &quot;{searchQuery}&quot;
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                Enter a search term to find notes
              </Text>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    backgroundColor: "#f9f9f9",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loader: {
    marginTop: 20,
  },
  resultsList: {
    flex: 1,
    padding: 16,
  },
  noteItem: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  notePreview: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
  message: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
});
