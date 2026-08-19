import { Pressable, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { CustomButton } from '@/components/form-elements/custom-button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Feather } from '@expo/vector-icons';

export const NoteActionBar = ({
  isSaving,
  isPreviewing,
  canSave,
  onSave,
  onPreview,
}: {
  isSaving: boolean;
  isPreviewing: boolean;
  canSave: boolean;
  onSave: () => void;
  onPreview: () => void;
}) => {
  const { border, surface, icon } = useThemeColor({}, [
    'border',
    'surface',
    'icon',
  ]);

  return (
    <ThemedView style={[styles.actionBar, { borderTopColor: border }]}>
      <ThemedView style={styles.actionBarInner}>
        <Pressable
          onPress={onPreview}
          style={[styles.previewButton, { backgroundColor: surface }]}
        >
          <Feather
            name={isPreviewing ? 'edit-3' : 'eye'}
            size={22}
            color={icon}
          />
        </Pressable>
        <CustomButton
          containerStyle={styles.saveButton}
          onPress={onSave}
          title={isSaving ? 'Saving...' : 'Save'}
          disabled={!canSave || isSaving}
          isLoading={isSaving}
          variant="PRIMARY"
        />
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  actionBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
  },
});
