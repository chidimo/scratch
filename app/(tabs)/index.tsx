import { useAuth } from "@/context/AuthContext";
import { getGithubClient, Note } from "@/services/GithubClient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, signIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadNotes();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const githubClient = getGithubClient();
      const gists = await githubClient.getUserGists();

      const notesList: Note[] = gists
        .filter((gist) =>
          Object.keys(gist.files).some((filename) => filename.endsWith(".md")),
        )
        .map((gist) => {
          const mdFile = Object.keys(gist.files).find((filename) =>
            filename.endsWith(".md"),
          );
          return {
            id: gist.id,
            title:
              gist.description || mdFile?.replace(".md", "") || "Untitled Note",
            content: mdFile ? gist.files[mdFile].content : "",
            created_at: gist.created_at,
            updated_at: gist.updated_at,
            tags: [],
            gist_id: gist.id,
            sync_status: "synced" as const,
          };
        });

      setNotes(
        notesList.sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error loading notes:", error);
      Alert.alert("Error", "Failed to load notes. Please try again.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
  };

  const handleCreateNote = () => {
    router.push("/note/new");
  };

  const renderNoteItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteItem}
      onPress={() => router.push(`/note/${item.id}`)}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteDate}>
          {new Date(item.updated_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.notePreview} numberOfLines={3}>
        {item.content.substring(0, 150)}...
      </Text>
      <View style={styles.noteFooter}>
        <View style={styles.syncStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  item.sync_status === "synced" ? "#4CAF50" : "#FF9800",
              },
            ]}
          />
          <Text style={styles.statusText}>{item.sync_status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.authContainer}>
          <Text style={styles.title}>Welcome to Scratch</Text>
          <Text style={styles.subtitle}>
            Your personal scratchpad synced with GitHub Gists
          </Text>
          <TouchableOpacity style={styles.signInButton} onPress={signIn}>
            <Text style={styles.signInButtonText}>Sign in with GitHub</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first note to get started
            </Text>
          </View>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Notes</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateNote}
            >
              <Text style={styles.createButtonText}>+ New Note</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  signInButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  noteDate: {
    fontSize: 12,
    color: "#666",
  },
  notePreview: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    textTransform: "capitalize",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
