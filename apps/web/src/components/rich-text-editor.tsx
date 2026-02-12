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
  const [showPreview, setShowPreview] = useState(true);

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
      <div className="border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-indigo-600 focus-within:border-indigo-600 overflow-hidden">
        {editor && <RteToolbar editor={editor} />}

        {/* Toggle Preview Button */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2">
          <div className="text-xs font-medium text-gray-600">Live Preview</div>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={mergeClasses(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              showPreview ? 'bg-indigo-600' : 'bg-gray-300',
            )}
          >
            <span
              className={mergeClasses(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                showPreview ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
        </div>

        {/* Editor and Preview Container */}
        <div
          className={mergeClasses(
            'flex',
            showPreview ? 'flex-row' : 'flex-col',
          )}
        >
          {/* Editor Side */}
          <div
            className={mergeClasses(
              showPreview ? 'flex-1 border-r border-gray-200' : 'w-full',
            )}
          >
            <EditorContent editor={editor} />
          </div>

          {/* Preview Side */}
          {showPreview && (
            <div className="flex-1 overflow-auto bg-gray-50">
              <div className="prose prose-sm max-w-none p-4 whitespace-pre-wrap break-words">
                {value ? (
                  <div
                    className="[&_p]:mb-4 [&_h1]:mb-4 [&_h2]:mb-3 [&_ul]:mb-4 [&_ol]:mb-4"
                    dangerouslySetInnerHTML={{ __html: value }}
                  />
                ) : (
                  <p className="text-gray-400">
                    {placeholder || 'Preview appears here...'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
