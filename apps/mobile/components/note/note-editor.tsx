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
        placeholder="Untitled"
        containerStyle={styles.titleContainer}
        textStyle={styles.titleInput}
      />

      <CustomInput
        value={content}
        onChangeText={onContentChange}
        editable={isContentEditable}
        multiline
        textAlignVertical="top"
        placeholder="Start writing..."
        containerStyle={styles.contentContainer}
        textStyle={styles.contentInput}
      />
    </>
  );
};

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 4,
  },
  titleInput: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
    height: 'auto',
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  contentContainer: {
    marginBottom: 0,
  },
  contentInput: {
    fontSize: 17,
    height: 'auto',
    lineHeight: 26,
    minHeight: 300,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
});
