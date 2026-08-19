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
  isPreviewing?: boolean;
};

export const RichTextEditor = (props: Props) => {
  const {
    value,
    onChange,
    label,
    className = '',
    placeholder,
    isPreviewing = false,
  } = props;

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
    <div className={mergeClasses('bg-white', className)}>
      {label ? <label className="mb-1 block">{label}</label> : null}
      <div className="border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-brand-500 focus-within:border-brand-500 overflow-hidden">
        {isPreviewing ? (
          <div className="prose prose-sm max-w-none p-4 min-h-[240px]">
            {value ? (
              <div
                className="[&_p]:mb-4 [&_h1]:mb-4 [&_h2]:mb-3 [&_ul]:mb-4 [&_ol]:mb-4"
                dangerouslySetInnerHTML={{ __html: value }}
              />
            ) : (
              <p className="text-gray-400">
                {placeholder || 'Nothing to preview yet...'}
              </p>
            )}
          </div>
        ) : (
          <>
            {editor && <RteToolbar editor={editor} />}
            <EditorContent editor={editor} />
          </>
        )}
      </div>
    </div>
  );
};
