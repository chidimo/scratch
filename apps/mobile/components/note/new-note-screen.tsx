import { useAuth } from '@/context/AuthContext';
import { useCreateGist } from '@/hooks/use-gists';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { CustomButton } from '../../components/form-elements/custom-button';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { PreviewMarkdown } from './preview-markdown';
import { NoteEditor } from './note-editor';

export const NewNoteScreen = () => {
  const { token } = useAuth();
  const router = useRouter();
  const createGist = useCreateGist();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const handlePreview = () => {
    setIsPreview(!isPreview);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be signed in to create a note');
      return;
    }

    try {
      await createGist.mutateAsync({
        description: title.trim(),
        files: {
          [`${title.trim()}.md`]: { content: content.trim() },
        },
        public: false,
      });

      Alert.alert('Success', 'Note created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.header}>
        <ThemedText style={styles.headerTitle}>New Note</ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {isPreview ? (
          <PreviewMarkdown title={title} content={content} />
        ) : (
          <NoteEditor
            title={title}
            content={content}
            isTitleEditable={!createGist.isPending}
            isContentEditable={!createGist.isPending}
            onTitleChange={setTitle}
            onContentChange={setContent}
          />
        )}
      </ScrollView>

      <ThemedView style={styles.actionBar}>
        <ThemedView style={styles.actionBarInner}>
          <CustomButton
            containerStyle={{ width: '30%' }}
            onPress={handleCancel}
            title="Cancel"
            variant="CANCEL"
            disabled={createGist.isPending}
          />
          <CustomButton
            containerStyle={{ width: '30%' }}
            onPress={handlePreview}
            title={isPreview ? 'Edit' : 'Preview'}
            variant="SUCCESS"
            disabled={createGist.isPending}
          />
          <CustomButton
            containerStyle={{ width: '30%' }}
            onPress={handleSave}
            title={createGist.isPending ? 'Saving...' : 'Save'}
            disabled={createGist.isPending || !title.trim() || !content.trim()}
            isLoading={createGist.isPending}
            variant="PRIMARY"
          />
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  previewContainer: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    padding: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  contentInput: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
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

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 16,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 12,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 8,
  },
  paragraph: {
    marginBottom: 12,
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    padding: 2,
    borderRadius: 3,
    fontFamily: 'monospace' as const,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
  },
  fence: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    fontFamily: 'monospace' as const,
    marginBottom: 12,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  blockquote: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
    paddingLeft: 12,
    marginBottom: 12,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline' as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  strong: {
    fontWeight: 'bold' as const,
  },
};
