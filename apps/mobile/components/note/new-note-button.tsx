import { useAuth } from '@/context/AuthContext';
import { useCreateGist } from '@/hooks/use-gists';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { CustomButton } from '@/components/form-elements/custom-button';
import { CustomInput } from '@/components/form-elements/custom-input';
import { ThemedView } from '@/components/themed-view';
import { CustomModal } from '@/components/custom-modal';

const PLACEHOLDER_CONTENT = '# New note';

export const NewNoteButton = () => {
  const { token } = useAuth();
  const router = useRouter();
  const { mutateAsync: createGist, isPending } = useCreateGist();

  const [title, setTitle] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

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
      await createGist(
        {
          description: title.trim(),
          files: {
            [`${title.trim()}.md`]: { content: PLACEHOLDER_CONTENT },
          },
          public: false,
        },
        {
          onSuccess: (gist) => {
            setTitle('');
            setIsModalVisible(false);
            if (gist?.id) {
              router.push(`/note/${gist.id}`);
            }
          },
        },
      );
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  const handleCancel = () => {
    if (isPending) {
      return;
    }
    setIsModalVisible(false);
    router.push('/');
  };

  return (
    <>
      <CustomButton
        title="+ New"
        variant="PRIMARY"
        onPress={() => setIsModalVisible(true)}
        containerStyle={{ width: 100 }}
      />
      <CustomModal
        title="New Note"
        visible={isModalVisible}
        onRequestClose={handleCancel}
      >
        <CustomInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter a title"
          editable={!isPending}
          returnKeyType="done"
        />
        <ThemedView style={styles.modalActions}>
          <CustomButton
            containerStyle={{ width: '45%' }}
            onPress={handleCancel}
            title="Cancel"
            variant="CANCEL"
            disabled={isPending}
          />
          <CustomButton
            containerStyle={{ width: '45%' }}
            onPress={handleContinue}
            title={isPending ? 'Creating...' : 'Continue'}
            disabled={isPending || !title.trim()}
            isLoading={isPending}
            variant="PRIMARY"
          />
        </ThemedView>
      </CustomModal>
    </>
  );
};

const styles = StyleSheet.create({
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
