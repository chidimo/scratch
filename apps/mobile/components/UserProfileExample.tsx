import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useUserProfile, useRefreshUserProfile } from '../hooks/use-user-profile';

export default function UserProfileExample() {
  const { token, signIn } = useAuth();
  const { data: userProfile, isLoading, error } = useUserProfile(token);
  const refreshProfile = useRefreshUserProfile();

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Please sign in to view profile</Text>
        <Button title="Sign In" onPress={signIn} />
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Error: {error.message}</Text>
        <Button title="Retry" onPress={() => refreshProfile()} />
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No profile data available</Text>
        <Button title="Refresh" onPress={() => refreshProfile()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Text style={styles.name}>{userProfile.name || userProfile.login}</Text>
        <Text style={styles.username}>@{userProfile.login}</Text>
        {userProfile.email && (
          <Text style={styles.email}>{userProfile.email}</Text>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userProfile.followers || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userProfile.following || 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userProfile.public_repos || 0}</Text>
          <Text style={styles.statLabel}>Repositories</Text>
        </View>
      </View>

      <View style={styles.bio}>
        <Text style={styles.bioText}>
          {userProfile.bio || 'No bio available'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button 
          title="Refresh Profile" 
          onPress={() => refreshProfile()}
        />
      </View>

      {userProfile.location && (
        <Text style={styles.location}>📍 {userProfile.location}</Text>
      )}

      {userProfile.company && (
        <Text style={styles.company}>🏢 {userProfile.company}</Text>
      )}

      {userProfile.blog && (
        <Text style={styles.blog}>🔗 {userProfile.blog}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  bio: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  actions: {
    marginBottom: 20,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  company: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  blog: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center',
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
});
