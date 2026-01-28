import { useAuth } from "@/context/AuthContext";
import { getGithubClient } from "@/services/GithubClient";
import React from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function SettingsScreen() {
  const { user, signOut, isLoading } = useAuth();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleCheckRateLimit = async () => {
    try {
      const githubClient = getGithubClient();
      const rateLimit = await githubClient.getRateLimitStatus();
      Alert.alert(
        "GitHub API Rate Limit",
        `Remaining: ${rateLimit.remaining}\nLimit: ${rateLimit.limit}\nResets: ${new Date(rateLimit.reset * 1000).toLocaleString()}`,
      );
    } catch {
      Alert.alert("Error", "Failed to fetch rate limit status");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Please sign in to access settings.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userLogin}>@{user.login}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GitHub API</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleCheckRateLimit}
        >
          <Text style={styles.settingText}>Check Rate Limit</Text>
          <Text style={styles.settingDescription}>View GitHub API usage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Sync Settings</Text>
          <Text style={styles.settingDescription}>
            Configure synchronization options
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Export Data</Text>
          <Text style={styles.settingDescription}>
            Export all notes and settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>About</Text>
          <Text style={styles.settingDescription}>
            App version and information
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.settingItem, styles.dangerItem]}
          onPress={handleSignOut}
        >
          <Text style={[styles.settingText, styles.dangerText]}>Sign Out</Text>
          <Text style={styles.settingDescription}>
            Sign out from your GitHub account
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    backgroundColor: "#fff",
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfo: {
    padding: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userLogin: {
    fontSize: 14,
    color: "#666",
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  dangerItem: {
    backgroundColor: "#fff5f5",
  },
  dangerText: {
    color: "#d32f2f",
  },
  message: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
});
