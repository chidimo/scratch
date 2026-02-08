import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

type Props = {
  editor: Editor;
  active: boolean;
  closeDialog: () => void;
};

export const EditorVimeoUploader = ({ editor, active, closeDialog }: Props) => {
  useEffect(() => {
    if (!active) return;
    const url = globalThis.prompt('Enter Vimeo URL');
    if (url) {
      const commands = editor.commands as any;
      if (commands.setVimeoVideo) {
        commands.setVimeoVideo({ src: url });
      } else {
        editor.commands.insertContent(url);
      }
    }
    closeDialog();
  }, [active, closeDialog, editor]);

  return null;
};
