import { useAuth } from '@/context/AuthContext';
import { useCreateGist } from '@/hooks/use-gists';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { CustomButton } from '../../components/form-elements/custom-button';
import { CustomInput } from '../../components/form-elements/custom-input';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const PLACEHOLDER_CONTENT = '# New note\n\nStart writing here.\n';

export const NewNoteScreen = () => {
  const { token } = useAuth();
  const router = useRouter();
  const createGist = useCreateGist();

  const [title, setTitle] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(true);

  const handleContinue = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be signed in to create a note');
      return;
    }

    try {
      const gist = await createGist.mutateAsync({
        description: title.trim(),
        files: {
          [`${title.trim()}.md`]: { content: PLACEHOLDER_CONTENT },
        },
        public: false,
      });

      setIsModalVisible(false);
      if (gist?.id) {
        router.replace(`/note/${gist.id}`);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  const handleCancel = () => {
    if (createGist.isPending) {
      return;
    }
    setIsModalVisible(false);
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalBackdrop} />
          <ThemedView style={styles.modalCard}>
            <ThemedText style={styles.modalTitle}>New Note</ThemedText>
            <CustomInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter a title"
              editable={!createGist.isPending}
              returnKeyType="done"
            />
            <ThemedView style={styles.modalActions}>
              <CustomButton
                containerStyle={{ width: '45%' }}
                onPress={handleCancel}
                title="Cancel"
                variant="CANCEL"
                disabled={createGist.isPending}
              />
              <CustomButton
                containerStyle={{ width: '45%' }}
                onPress={handleContinue}
                title={createGist.isPending ? 'Creating...' : 'Continue'}
                disabled={createGist.isPending || !title.trim()}
                isLoading={createGist.isPending}
                variant="PRIMARY"
              />
            </ThemedView>
          </ThemedView>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalCard: {
    width: '90%',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
