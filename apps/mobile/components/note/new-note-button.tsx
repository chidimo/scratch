import { useAuth } from '@/context/AuthContext';
import { useCreateGist } from '@/hooks/use-gists';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CustomButton } from '@/components/form-elements/custom-button';
import { CustomInput } from '@/components/form-elements/custom-input';
import { ThemedView } from '@/components/themed-view';
import { CustomModal } from '@/components/custom-modal';

const PLACEHOLDER_CONTENT = '# New note';

export const NewNoteButton = () => {
  const { token } = useAuth();
  const router = useRouter();
  const { mutateAsync: createGist, isPending } = useCreateGist();
  const { tint, onTint } = useThemeColor({}, ['tint', 'onTint']);

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
      <Pressable
        onPress={() => setIsModalVisible(true)}
        style={[styles.fab, { backgroundColor: tint }]}
        hitSlop={8}
      >
        <Feather name="plus" size={24} color={onTint} />
      </Pressable>
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
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
