import { useEffect } from 'react';
import { Editor } from '@tiptap/react';

type Props = {
  editor: Editor;
  active: boolean;
  closeDialog: () => void;
};

export const EditorYouTubeUploader = ({
  editor,
  active,
  closeDialog,
}: Props) => {
  useEffect(() => {
    if (!active) return;
    const url = globalThis.prompt('Enter YouTube URL');
    if (url) {
      const commands = editor.commands as any;
      if (commands.setYoutubeVideo) {
        commands.setYoutubeVideo({ src: url });
      } else {
        editor.commands.insertContent(url);
      }
    }
    closeDialog();
  }, [active, closeDialog, editor]);

  return null;
};
