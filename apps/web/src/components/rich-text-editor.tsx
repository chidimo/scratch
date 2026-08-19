import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';
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
  const [isPreviewing, setIsPreviewing] = useState(false);

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
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-2 py-1.5">
          {isPreviewing ? (
            <span className="px-2 text-xs font-medium text-gray-500">
              Preview
            </span>
          ) : (
            editor && <RteToolbar editor={editor} />
          )}
          <button
            type="button"
            onClick={() => setIsPreviewing((prev) => !prev)}
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 px-2 py-1 rounded transition-colors"
          >
            {isPreviewing ? 'Edit' : 'Preview'}
          </button>
        </div>

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
          <EditorContent editor={editor} />
        )}
      </div>
    </div>
  );
};
