import { StyleSheet } from 'react-native';
import { CustomInput } from '@/components/form-elements/custom-input';

type Props = {
  title: string;
  content: string;
  isTitleEditable: boolean;
  isContentEditable: boolean;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
};

export const NoteEditor = ({
  title,
  content,
  isTitleEditable,
  isContentEditable,
  onTitleChange,
  onContentChange,
}: Props) => {
  return (
    <>
      <CustomInput
        value={title}
        onChangeText={onTitleChange}
        editable={isTitleEditable}
        multiline
        maxLength={100}
        placeholder="Note Title"
        textStyle={styles.titleInput}
      />

      <CustomInput
        value={content}
        onChangeText={onContentChange}
        editable={isContentEditable}
        multiline
        textAlignVertical="top"
        placeholder="Start writing your note..."
        textStyle={styles.contentInput}
      />
    </>
  );
};

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    height: 'auto',
    paddingBottom: 8,
    padding: 0,
  },
  contentInput: {
    fontSize: 16,
    height: 'auto',
    lineHeight: 24,
    minHeight: 300,
    padding: 0,
  },
});
