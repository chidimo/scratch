import { Editor } from '@tiptap/react';

type DialogName = 'modifyLink';

export const useDialogs = () => {
  const openDialog = (name: DialogName, { editor }: { editor: Editor }) => {
    if (name === 'modifyLink') {
      const previousUrl = editor.getAttributes('link')?.href as
        | string
        | undefined;
      const url = globalThis.prompt('Enter URL', previousUrl || '');
      if (url === null) {
        return;
      }
      if (url.trim() === '') {
        editor.chain().focus().unsetLink().run();
        return;
      }
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  };

  return { openDialog };
};
