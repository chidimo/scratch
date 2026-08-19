import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
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
      StarterKit.configure({
        hardBreak: {
          keepMarks: true,
        },
      }),
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
        class: 'prose prose-sm max-w-none min-h-[240px] p-4 focus:outline-none',
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
          class:
            'prose prose-sm max-w-none min-h-[240px] p-4 focus:outline-none',
          'data-placeholder': placeholder,
        },
      },
    });
  }, [editor, placeholder]);

  return (
    <div className={mergeClasses('mt-2 bg-white', className)}>
      {label ? <label className="mb-1 block">{label}</label> : null}
      <div className="border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 overflow-hidden">
        {editor && <RteToolbar editor={editor} />}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
