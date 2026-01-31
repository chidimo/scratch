import { useGistOperationsById } from '@/hooks/use-gists';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { ThemedView } from './themed-view';
import { CustomSwitch } from '@/components/form-elements/custom-switch';
import { CustomButton } from './form-elements/custom-button';
import { CustomInput } from './form-elements/custom-input';

export const NoteScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { note, isLoading, error, updateNote, deleteNote, isMutating } =
    useGistOperationsById(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Update form when note data changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setIsPublic(note.is_public ?? false);
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Invalid note ID');
      return;
    }

    try {
      await updateNote.mutateAsync({
        id,
        title: title.trim(),
        content: content.trim(),
        isPublic,
      });

      Alert.alert('Success', 'Note updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating note:', error);
      Alert.alert('Error', 'Failed to update note. Please try again.');
    }
  };

  const handlePrivacyToggle = async (nextValue: boolean) => {
    if (!note || !id || isMutating) {
      return;
    }

    const previousValue = isPublic;
    const nextTitle = title.trim() || note.title;
    const nextContent = content.trim() || note.content;
    setIsPublic(nextValue);

    try {
      await updateNote.mutateAsync({
        id,
        title: nextTitle,
        content: nextContent,
        isPublic: nextValue,
      });
    } catch (error) {
      console.error('Error updating note privacy:', error);
      setIsPublic(previousValue);
      Alert.alert('Error', 'Failed to update note privacy. Please try again.');
    }
  };

  const handleCancel = () => {
    const hasChanges =
      title.trim() !== note?.title ||
      content.trim() !== note?.content ||
      isPublic !== (note?.is_public ?? false);

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;

            try {
              await deleteNote.mutateAsync(id);

              Alert.alert('Success', 'Note deleted successfully!', [
                {
                  text: 'OK',
                  onPress: () => router.replace('/'),
                },
              ]);
            } catch (error) {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator />
        <ThemedText style={styles.loadingText}>Loading note...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.errorText}>Error: {error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!note) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={styles.loadingText}>Note not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>Edit Note</ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.privacyRow}>
          <CustomSwitch
            value={isPublic}
            onChange={handlePrivacyToggle}
            label={isPublic ? 'Public gist' : 'Private gist'}
            containerStyle={{ padding: 6 }}
          />
        </ThemedView>

        <CustomInput
          textStyle={styles.titleInput}
          placeholder="Note Title"
          value={title}
          onChangeText={setTitle}
          editable={!isMutating}
          multiline
          maxLength={100}
        />

        <CustomInput
          textStyle={styles.contentInput}
          placeholder="Start writing your note..."
          value={content}
          onChangeText={setContent}
          editable={!isMutating}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>

      <NoteActionBar
        isSaving={isMutating}
        canSave={!!title.trim() && !!content.trim()}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />
    </KeyboardAvoidingView>
  );
};

const NoteActionBar = ({
  isSaving,
  canSave,
  onSave,
  onCancel,
  onDelete,
}: {
  isSaving: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  return (
    <ThemedView style={styles.actionBar}>
      <ThemedView style={styles.actionBarInner}>
        <CustomButton
          containerStyle={{ width: '30%' }}
          onPress={onCancel}
          title="Back"
          variant="SECONDARY"
        />
        <CustomButton
          containerStyle={{ width: '30%' }}
          onPress={onSave}
          title={isSaving ? 'Saving...' : 'Save'}
          disabled={!canSave || isSaving}
          isLoading={isSaving}
          variant="PRIMARY"
        />
        <CustomButton
          containerStyle={{ width: '30%' }}
          onPress={onDelete}
          title="Delete"
          disabled={isSaving}
          variant="DANGER"
        />
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 120,
  },
  privacyRow: {
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    height: 'auto',
    padding: 0,
    paddingBottom: 8,
  },
  contentInput: {
    fontSize: 16,
    height: 'auto',
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
  },
  errorText: {
    fontSize: 16,
    color: '#ff0000',
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  actionBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
