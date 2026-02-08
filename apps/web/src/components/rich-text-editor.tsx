import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import { mergeClasses } from '../utils/class-merge';
import { RteToolbar } from './rich-text-editor-toolbar';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
};

export const RichTextEditor = (props: Props) => {
  const { value, onChange, label, className = '', placeholder } = props;
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Underline,
      Link.configure({ openOnClick: false }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        allowFullscreen: true,
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[240px] p-4 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor || !placeholder) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          class: 'prose max-w-none min-h-[240px] p-4 focus:outline-none',
          'data-placeholder': placeholder,
        },
      },
    });
  }, [editor, placeholder]);

  return (
    <div className={mergeClasses('mt-2 bg-white', className)}>
      {label ? <label className="mb-1 block">{label}</label> : null}
      <div className="border border-gray-300 rounded-md pt-1 shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600">
        {editor && <RteToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
