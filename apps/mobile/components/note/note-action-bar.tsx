import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { CustomButton } from '@/components/form-elements/custom-button';
import { useThemeColor } from '@/hooks/use-theme-color';

export const NoteActionBar = ({
  isSaving,
  isPreviewing,
  canSave,
  onSave,
  onCancel,
  onDelete,
  onPreview,
}: {
  isSaving: boolean;
  isPreviewing: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) => {
  const { border } = useThemeColor({}, ['border']);

  return (
    <ThemedView style={[styles.actionBar, { borderTopColor: border }]}>
      <ThemedView style={styles.actionBarInner}>
        <CustomButton
          containerStyle={{ width: '22%' }}
          onPress={onCancel}
          title="Back"
          variant="SECONDARY"
        />
        <CustomButton
          containerStyle={{ width: '22%' }}
          onPress={onSave}
          title={isSaving ? 'Saving...' : 'Save'}
          disabled={!canSave || isSaving}
          isLoading={isSaving}
          variant="PRIMARY"
        />
        <CustomButton
          containerStyle={{ width: '22%' }}
          onPress={onPreview}
          title={isPreviewing ? 'Edit' : 'Preview'}
          variant="SUCCESS"
        />
        <CustomButton
          containerStyle={{ width: '22%' }}
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
    justifyContent: 'space-between',
    gap: 12,
  },
});
