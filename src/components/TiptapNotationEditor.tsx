import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export function TiptapNotationEditor({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type tonic sol-fa notation, lyrics, separators, and rehearsal text...'
      })
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'min-h-28 rounded-lg border border-slate-200 bg-white p-3 font-notation text-sm outline-none dark:border-slate-700 dark:bg-slate-900'
      }
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    }
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  return <EditorContent editor={editor} />;
}
