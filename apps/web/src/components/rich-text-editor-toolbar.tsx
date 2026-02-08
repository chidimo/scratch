import { useCallback, useMemo } from 'react';
import {
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatUnderline,
  mdiFormatHeader1,
  mdiFormatHeader2,
  mdiFormatListBulletedType,
  mdiFormatListNumbered,
  mdiFormatParagraph,
  mdiUndo,
  mdiRedo,
  mdiImage,
  mdiLink,
  mdiLinkOff,
  mdiYoutube,
  mdiFormatAlignLeft,
  mdiFormatAlignCenter,
  mdiFormatAlignRight,
} from '@mdi/js';
import { Icon } from '@mdi/react';
import { Editor } from '@tiptap/react';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { useFileUpload } from '../services/upload';
import { useDialogs, EditorYouTubeUploader } from './dialogs';
import { mergeClasses } from '../utils/class-merge';
import { useOnOffSwitch } from '../hooks/use-on-off-switch';

const Spacer = { type: 'spacer' };

type ToolbarItem = {
  icon: string;
  label: string;
  action: () => void;
  show?: () => boolean;
  isActive: () => boolean;
  // I added this so I could toggle a modal
  embedModalOpen?: () => boolean;
};

type Item = ToolbarItem | typeof Spacer;

type ToolbarArray = (Item[] | Item)[];

const useEditorToolbar = (editor: Editor) => {
  const { openDialog } = useDialogs();
  const { upload, uploading } = useFileUpload();
  const loading = useMemo(() => uploading, [uploading]);

  const {
    isOn: isYoutubeOn,
    turnOn: turnYoutubeOn,
    turnOff: turnYoutubeOff,
  } = useOnOffSwitch();

  const uploadFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const data = await upload({ file });
        if (data.mime.includes('image')) {
          editor.commands.setImage({ src: data.url });
        } else {
          editor.commands.insertContent(data.url);
        }
      }
    };
  }, [editor, upload]);

  const modifyLink = useCallback(() => {
    openDialog('modifyLink', { editor });
  }, [editor, openDialog]);

  const items = useMemo<ToolbarArray>(
    () => [
      {
        icon: mdiFormatBold,
        action: () => editor.chain().focus().toggleBold().run(),
        label: 'Bold',
        isActive: () => editor.isActive('bold') ?? false,
      },
      {
        icon: mdiFormatItalic,
        action: () => editor.chain().focus().toggleItalic().run(),
        label: 'Italic',
        isActive: () => editor.isActive('italic') ?? false,
      },
      {
        icon: mdiFormatUnderline,
        action: () => editor.chain().focus().toggleUnderline().run(),
        label: 'Underline',
        isActive: () => editor.isActive('underline') ?? false,
      },
      [
        {
          icon: mdiFormatHeader1,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 1 }).run(),
          label: 'Heading 1',
          isActive: () => editor.isActive('heading', { level: 1 }) ?? false,
        },
        {
          icon: mdiFormatHeader2,
          action: () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
          label: 'Heading 2',
          isActive: () => editor.isActive('heading', { level: 2 }) ?? false,
        },
        {
          icon: mdiFormatParagraph,
          action: () => editor.chain().focus().setParagraph().run(),
          label: 'Paragraph',
          isActive: () => editor.isActive('paragraph') ?? false,
        },
      ],
      Spacer,
      {
        icon: mdiFormatListBulletedType,
        action: () => editor.chain().focus().toggleBulletList().run(),
        label: 'Bulleted List',
        isActive: () => editor.isActive('bulletList') ?? false,
      },
      {
        icon: mdiFormatListNumbered,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        label: 'Bulleted List',
        isActive: () => editor.isActive('orderedList') ?? false,
      },
      // Spacer,
      {
        icon: mdiUndo,
        action: () => editor.chain().focus().undo().run(),
        label: 'Undo',
        isActive: () => false,
      },
      {
        icon: mdiRedo,
        action: () => editor.chain().focus().redo().run(),
        label: 'Redo',
        isActive: () => false,
      },
      Spacer,
      {
        icon: mdiFormatAlignLeft,
        action: () => editor.chain().focus().setTextAlign('left').run(),
        label: 'Align Left',
        isActive: () => editor.isActive({ textAlign: 'left' }),
      },
      {
        icon: mdiFormatAlignCenter,
        action: () => editor.chain().focus().setTextAlign('center').run(),
        label: 'Align Center',
        isActive: () => editor.isActive({ textAlign: 'center' }),
      },
      {
        icon: mdiFormatAlignRight,
        action: () => editor.chain().focus().setTextAlign('right').run(),
        label: 'Align Right',
        isActive: () => editor.isActive({ textAlign: 'right' }),
      },
      Spacer,
      {
        icon: mdiImage,
        action: uploadFile,
        label: 'Upload Image',
        isActive: () => false,
      },
      {
        icon: mdiLink,
        action: modifyLink,
        label: 'Link',
        isActive: () => editor.isActive('link'),
      },
      {
        icon: mdiLinkOff,
        action: () => editor.chain().focus().unsetLink().run(),
        label: 'Unset Link',
        show: () => editor.isActive('link'),
        isActive: () => true,
      },
      Spacer,
      {
        icon: mdiYoutube,
        action: isYoutubeOn ? turnYoutubeOff : turnYoutubeOn,
        label: 'youtube-video',
        isActive: () => editor.isActive('youtube'),
        embedModalOpen: () => isYoutubeOn,
      },
    ],
    [
      editor,
      modifyLink,
      uploadFile,
      turnYoutubeOn,
      turnYoutubeOff,
      isYoutubeOn,
    ],
  );
  return { items, loading };
};

export const RteToolbar = ({ editor }: { editor: Editor }) => {
  const { items } = useEditorToolbar(editor);

  if (!editor) return null;

  const renderToolbarItems = (item: Item[] | Item, index: number) => {
    const tbItem = item as ToolbarItem;

    if (item === Spacer)
      return (
        <div key={index} className="flex h-14 border-r border-r-gray-300" />
      );

    if (Array.isArray(item)) {
      const activeItem = (item as ToolbarItem[]).find((a) => a.isActive());

      return (
        <Menu
          as="div"
          className="relative divity inline-block text-left"
          key={index}
        >
          <Menu.Button className="flex px-2 h-10 items-center">
            {activeItem?.label}
            <ChevronDownIcon
              className="-mr-1 ml-2 h-5 w-5"
              aria-hidden="true"
            />
          </Menu.Button>
          <Menu.Items className="origin-top-left absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white focus:outline-none z-50">
            {(item as ToolbarItem[]).map((a) => (
              <Menu.Item key={a.label}>
                {({ active }: { active: boolean }) => (
                  <button
                    onClick={a.action}
                    title={a.label}
                    className={mergeClasses(
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                      'block px-4 py-2 text-sm w-full text-left',
                    )}
                  >
                    {a.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Menu>
      );
    }

    if (tbItem.show && !tbItem.show()) return null;

    if (tbItem.label === 'youtube-video') {
      return (
        <div key={index}>
          <button
            title="YouTube video"
            aria-label="Insert YouTube video"
            className={mergeClasses(
              'px-2 h-10 flex items-center',
              tbItem.isActive() ? 'text-blue-500' : 'text-gray-800',
            )}
            onClick={(e) => {
              e.preventDefault();
              tbItem.action();
            }}
          >
            <Icon
              className="w-5 h-5"
              color={'currentColor'}
              path={tbItem.icon}
            />
          </button>
          <EditorYouTubeUploader
            editor={editor}
            closeDialog={() => {
              tbItem.action?.();
            }}
            active={tbItem.embedModalOpen?.() ?? false}
          />
        </div>
      );
    }

    return (
      <button
        key={index}
        title={tbItem.label}
        aria-label={tbItem.label}
        className={mergeClasses(
          'px-2 h-10 flex items-center',
          tbItem.isActive() ? 'text-blue-500' : 'text-gray-800',
        )}
        onClick={(e) => {
          e.preventDefault();
          tbItem.action();
        }}
      >
        <Icon className="w-5 h-5" color={'currentColor'} path={tbItem.icon} />
      </button>
    );
  };

  return (
    <div className="w-full border-b border-gray-300 flex h-14 items-center">
      {items.map((item, index) => renderToolbarItems(item, index))}
    </div>
  );
};
