import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import { cx } from "@/shared/lib/cx";

type ToolbarAction = {
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  // Toggles (bold, title…) expose their state with aria-pressed.
  isActive?: (editor: Editor) => boolean;
  canRun?: (editor: Editor) => boolean;
};

const ACTIONS: ToolbarAction[] = [
  {
    label: "Gras",
    icon: Bold,
    run: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    label: "Italique",
    icon: Italic,
    run: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    label: "Souligné",
    icon: Underline,
    run: (editor) => editor.chain().focus().toggleUnderline().run(),
    isActive: (editor) => editor.isActive("underline"),
  },
  {
    label: "Titre",
    icon: Heading2,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    label: "Sous-titre",
    icon: Heading3,
    run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  {
    label: "Liste à puces",
    icon: List,
    run: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    label: "Liste numérotée",
    icon: ListOrdered,
    run: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    label: "Citation",
    icon: Quote,
    run: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
  {
    label: "Annuler",
    icon: Undo2,
    run: (editor) => editor.chain().focus().undo().run(),
    canRun: (editor) => editor.can().undo(),
  },
  {
    label: "Rétablir",
    icon: Redo2,
    run: (editor) => editor.chain().focus().redo().run(),
    canRun: (editor) => editor.can().redo(),
  },
];

type EditorToolbarProps = {
  editor: Editor;
  editorId: string;
};

export function EditorToolbar({ editor, editorId }: EditorToolbarProps) {
  const [focusIndex, setFocusIndex] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // Re-renders the toolbar only when one of these values changes.
  const states = useEditorState({
    editor,
    selector: ({ editor: current }) =>
      ACTIONS.map((action) => ({
        active: action.isActive?.(current) ?? false,
        enabled: action.canRun?.(current) ?? true,
      })),
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const last = ACTIONS.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: focusIndex === last ? 0 : focusIndex + 1,
      ArrowLeft: focusIndex === 0 ? last : focusIndex - 1,
      Home: 0,
      End: last,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setFocusIndex(next);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="toolbar"
      aria-label="Mise en forme"
      aria-controls={editorId}
      onKeyDown={handleKeyDown}
      className="flex flex-wrap gap-1 rounded-control border border-line bg-surface p-1"
    >
      {ACTIONS.map((action, index) => {
        const Icon = action.icon;
        const state = states[index] ?? { active: false, enabled: true };
        return (
          <button
            key={action.label}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            tabIndex={index === focusIndex ? 0 : -1}
            aria-label={action.label}
            aria-pressed={action.isActive ? state.active : undefined}
            aria-disabled={state.enabled ? undefined : true}
            onClick={() => {
              setFocusIndex(index);
              if (state.enabled) action.run(editor);
            }}
            className={cx(
              "inline-flex size-11 items-center justify-center rounded-control",
              state.active && "bg-primary text-on-brand",
              !state.enabled && "cursor-not-allowed opacity-50",
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
          </button>
        );
      })}
    </div>
  );
}
