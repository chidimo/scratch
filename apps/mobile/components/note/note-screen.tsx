import {
  useDeleteGistById,
  useGistById,
  useUpdateGistById,
} from '@/hooks/use-gists';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { CustomSwitch } from '@/components/form-elements/custom-switch';
import { NoteActionBar } from './note-action-bar';
import { HorizontalFileTabs } from './horizontal-file-tabs';
import { NoteEditor } from './note-editor';
import { PreviewMarkdown } from './preview-markdown';

export const NoteScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const { mutateAsync: deleteGist, isPending: isDeleting } =
    useDeleteGistById();
  const { mutateAsync: updateGist, isPending: isUpdating } =
    useUpdateGistById();
  const {
    data: note,
    error,
    isPending,
  } = useGistById(id, {
    enabled: !isDeletingNote && !isDeleting,
  });

  const isMutating = isUpdating || isDeleting;

  const [drafts, setDrafts] = useState<
    Record<string, { title: string; content: string }>
  >({});
  const [isPublic, setIsPublic] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const pagerRef = useRef<ScrollView | null>(null);
  const [pagerWidth, setPagerWidth] = useState(0);
  const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update form when note data changes
  useEffect(() => {
    if (note) {
      const primaryFile = note.file_name ?? note.md_files?.[0] ?? null;
      const initialFile = activeFile ?? primaryFile;
      const initialDrafts: Record<string, { title: string; content: string }> =
        {};
      const files = note.md_files ?? (primaryFile ? [primaryFile] : []);

      files.forEach((file) => {
        initialDrafts[file] = {
          title: file.replace('.md', ''),
          content: note.file_contents?.[file] ?? '',
        };
      });

      setActiveFile(initialFile);
      setDrafts(initialDrafts);
      setIsPublic(note.is_public ?? false);
    }
  }, [note]);

  const mdFiles = useMemo(() => note?.md_files ?? [], [note?.md_files]);
  const activeDraft = useMemo(() => {
    if (!activeFile) {
      return { title: '', content: '' };
    }
    return drafts[activeFile] ?? { title: '', content: '' };
  }, [activeFile, drafts]);

  const handleFileChange = (nextFile: string) => {
    if (!note || nextFile === activeFile) {
      return;
    }

    const currentFile = activeFile ?? note.file_name ?? note.md_files?.[0];
    if (!currentFile) {
      setActiveFile(nextFile);
      return;
    }

    const currentTitleBaseline = currentFile.replace('.md', '');
    const currentContentBaseline = note.file_contents?.[currentFile] ?? '';
    const currentDraft = drafts[currentFile] ?? {
      title: currentTitleBaseline,
      content: currentContentBaseline,
    };
    const currentIndex = mdFiles.indexOf(currentFile);

    const hasChanges =
      currentDraft.title.trim() !== currentTitleBaseline.trim() ||
      currentDraft.content.trim() !== currentContentBaseline.trim();

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Switching files will discard unsaved edits. Continue?',
        [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: () => {
              if (pagerRef.current && pagerWidth && currentIndex >= 0) {
                pagerRef.current.scrollTo({
                  x: pagerWidth * currentIndex,
                  animated: true,
                });
              }
            },
          },
          {
            text: 'Switch',
            style: 'destructive',
            onPress: () => {
              setActiveFile(nextFile);
            },
          },
        ],
      );
      return;
    }

    setActiveFile(nextFile);
    if (pagerRef.current && pagerWidth) {
      const nextIndex = mdFiles.indexOf(nextFile);
      if (nextIndex >= 0) {
        pagerRef.current.scrollTo({
          x: pagerWidth * nextIndex,
          animated: true,
        });
      }
    }
  };

  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = null;
    }

    if (!note || !id || isPreviewing || isMutating || isDeletingNote) {
      return;
    }

    const fileName = activeFile ?? note.file_name ?? note.md_files?.[0];
    if (!fileName) {
      return;
    }

    const draft = drafts[fileName];
    if (!draft) {
      return;
    }

    const baselineTitle = fileName.replace('.md', '');
    const baselineContent = note.file_contents?.[fileName] ?? '';
    const hasChanges =
      draft.title.trim() !== baselineTitle.trim() ||
      draft.content !== baselineContent;

    if (!hasChanges || !draft.title.trim()) {
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      const gistId = note.gist_id ?? id ?? '';
      if (!gistId) {
        return;
      }
      updateGist({
        id: gistId,
        title: draft.title.trim(),
        content: draft.content,
        isPublic,
        fileName,
      });
    }, 750);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    activeFile,
    drafts,
    id,
    isDeletingNote,
    isMutating,
    isPreviewing,
    isPublic,
    note,
    updateGist,
  ]);

  const handleSave = async () => {
    if (!activeDraft.title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!activeDraft.content.trim()) {
      Alert.alert('Error', 'Please enter content');
      return;
    }

    if (!id) {
      Alert.alert('Error', 'Invalid note ID');
      return;
    }

    try {
      const gistId = note?.gist_id ?? id ?? '';
      await updateGist({
        id: gistId,
        title: activeDraft.title.trim(),
        content: activeDraft.content.trim(),
        isPublic,
        fileName: activeFile ?? note?.file_name,
      });

      Alert.alert('Success', 'Note updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.push('/'),
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
    const nextTitle = activeDraft.title.trim() || note.title;
    const nextContent = activeDraft.content.trim() || note.content;
    const gistId = note.gist_id ?? id ?? '';
    setIsPublic(nextValue);

    try {
      await updateGist({
        id: gistId,
        title: nextTitle,
        content: nextContent,
        isPublic: nextValue,
        fileName: activeFile ?? note.file_name,
      });
    } catch (error) {
      console.error('Error updating note privacy:', error);
      setIsPublic(previousValue);
      Alert.alert('Error', 'Failed to update note privacy. Please try again.');
    }
  };

  const handleCancel = () => {
    const baselineTitle =
      (activeFile ? activeFile.replace('.md', '') : note?.title) ?? '';
    const baselineContent =
      (activeFile && note?.file_contents?.[activeFile]) ?? note?.content ?? '';
    const hasChanges =
      activeDraft.title.trim() !== baselineTitle.trim() ||
      activeDraft.content.trim() !== baselineContent.trim() ||
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
            onPress: () => router.push('/'),
          },
        ],
      );
    } else {
      router.push('/');
    }
  };

  const handleDelete = () => {
    const handleDeleteConfirm = async () => {
      if (!id) return;
      setIsDeletingNote(true);

      try {
        const gistId = note?.gist_id ?? id ?? '';
        await deleteGist(
          {
            id: gistId,
            fileName: activeFile ?? note?.file_name,
            mdFileCount: note?.md_file_count,
          },
          {
            onSuccess: () => {
              router.push('/');
            },
            onError: (error) => {
              console.error('Error deleting note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
              setIsDeletingNote(false);
            },
          },
        );
      } catch (error) {
        console.error('Error deleting note:', error);
        Alert.alert('Error', 'Failed to delete note. Please try again.');
        setIsDeletingNote(false);
      }
    };

    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDeleteConfirm();
          },
        },
      ],
    );
  };

  const handlePreview = () => {
    setIsPreviewing((value) => !value);
  };

  if (isPending) {
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
        {mdFiles.length > 1 ? (
          <HorizontalFileTabs
            files={mdFiles}
            activeFile={activeFile}
            onChange={handleFileChange}
          />
        ) : null}
        <ThemedView style={styles.privacyRow}>
          <CustomSwitch
            value={isPublic}
            onChange={handlePrivacyToggle}
            label={isPublic ? 'Public gist' : 'Private gist'}
            containerStyle={{ padding: 6 }}
          />
        </ThemedView>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => {
            setPagerWidth(event.nativeEvent.layout.width);
          }}
          onMomentumScrollEnd={(event) => {
            if (!pagerWidth) {
              return;
            }
            const nextIndex = Math.round(
              event.nativeEvent.contentOffset.x / pagerWidth,
            );
            const nextFile = mdFiles[nextIndex];
            if (nextFile && nextFile !== activeFile) {
              handleFileChange(nextFile);
            }
          }}
        >
          {mdFiles.map((file) => {
            const draft = drafts[file] ?? {
              title: file.replace('.md', ''),
              content: '',
            };
            return (
              <View key={file} style={{ width: pagerWidth || undefined }}>
                {isPreviewing ? (
                  <PreviewMarkdown
                    title={draft.title}
                    content={draft.content}
                  />
                ) : (
                  <NoteEditor
                    title={draft.title}
                    content={draft.content}
                    isTitleEditable={!isMutating}
                    isContentEditable={!isMutating}
                    onTitleChange={(value) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [file]: {
                          title: value,
                          content: prev[file]?.content ?? '',
                        },
                      }))
                    }
                    onContentChange={(value) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [file]: {
                          title: prev[file]?.title ?? file.replace('.md', ''),
                          content: value,
                        },
                      }))
                    }
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      </ScrollView>

      <NoteActionBar
        isSaving={isMutating}
        isPreviewing={isPreviewing}
        canSave={!!activeDraft.title.trim() && !!activeDraft.content.trim()}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onPreview={handlePreview}
      />
    </KeyboardAvoidingView>
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
  errorText: {
    fontSize: 16,
    color: '#ff0000',
  },
});
