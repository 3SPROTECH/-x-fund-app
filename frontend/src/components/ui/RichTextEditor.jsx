import { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
} from 'lucide-react';
import './RichTextEditor.css';

function Toolbar({ editor, disabled }) {
  const tools = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
      label: 'Gras',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
      label: 'Italique',
    },
    {
      icon: UnderlineIcon,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive('underline'),
      label: 'Souligné',
    },
    { type: 'divider' },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive('bulletList'),
      label: 'Liste à puces',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive('orderedList'),
      label: 'Liste numérotée',
    },
    { type: 'divider' },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive('heading', { level: 2 }),
      label: 'Titre',
    },
  ];

  return (
    <div className="rte-toolbar">
      {tools.map((tool, i) =>
        tool.type === 'divider' ? (
          <span key={i} className="rte-toolbar-divider" />
        ) : (
          <button
            key={i}
            type="button"
            className={`rte-toolbar-btn${tool.active ? ' active' : ''}`}
            onClick={tool.action}
            disabled={disabled}
            title={tool.label}
            aria-label={tool.label}
          >
            <tool.icon size={14} />
          </button>
        ),
      )}
    </div>
  );
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  minHeight = 120,
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      onChange?.(e.getHTML());
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (editor) editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) return null;

  return (
    <div className={`rte-wrapper${disabled ? ' rte-disabled' : ''}${className ? ` ${className}` : ''}`}>
      <Toolbar editor={editor} disabled={disabled} />
      <EditorContent
        editor={editor}
        className="rte-content"
        style={{ minHeight }}
      />
    </div>
  );
}
