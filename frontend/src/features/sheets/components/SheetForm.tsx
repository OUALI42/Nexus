import "../sheet-content.css";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useBlocker } from "react-router";

import { getFieldErrors, isApiError } from "@/shared/api";
import { Modal } from "@/shared/ui/Modal";
import { Button } from "@/shared/ui/Button";
import { FieldError } from "@/shared/ui/FieldError";
import { Input } from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/toast/useToast";

import { EditorToolbar } from "./EditorToolbar";

export type SheetValues = {
  title: string;
  content: string;
};

type FieldErrors = Partial<Record<keyof SheetValues, string>>;

const MAX_TITLE_LENGTH = 255;
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" });

function htmlOf(editor: Editor): string {
  // An empty editor still holds "<p></p>": store an empty string instead.
  return editor.isEmpty ? "" : editor.getHTML();
}

function editorAttributes(ids: {
  editorId: string;
  labelId: string;
  describedBy: string;
}): Record<string, string> {
  return {
    id: ids.editorId,
    role: "textbox",
    "aria-multiline": "true",
    "aria-labelledby": ids.labelId,
    "aria-describedby": ids.describedBy,
    class:
      "sheet-content min-h-64 rounded-control border border-line bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
  };
}

type SheetFormProps = {
  initialValues: SheetValues;
  submitLabel: string;
  save: (values: SheetValues) => Promise<unknown>;
};

export function SheetForm({
  initialValues,
  submitLabel,
  save,
}: SheetFormProps) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const editorId = `${formId}-editor`;
  const editorLabelId = `${formId}-editor-label`;
  const helpId = `${formId}-help`;
  const contentErrorId = `${formId}-content-error`;
  const toast = useToast();

  const [title, setTitle] = useState(initialValues.title);
  const [content, setContent] = useState(initialValues.content);
  // Last saved values: the form is "dirty" when it differs from them.
  const [baseline, setBaseline] = useState(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // No h1: the page already has its own main title.
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: initialValues.content,
    editorProps: {
      attributes: editorAttributes({
        editorId,
        labelId: editorLabelId,
        describedBy: helpId,
      }),
    },
    onUpdate: ({ editor: updated }) => {
      setContent(htmlOf(updated));
      setErrors((current) =>
        current.content ? { ...current, content: undefined } : current,
      );
    },
  });

  // Links the content error to the editor, like FieldError does for inputs.
  useEffect(() => {
    editor?.setOptions({
      editorProps: {
        attributes: editorAttributes({
          editorId,
          labelId: editorLabelId,
          describedBy: errors.content ? `${helpId} ${contentErrorId}` : helpId,
        }),
      },
    });
  }, [editor, errors.content, editorId, editorLabelId, helpId, contentErrorId]);

  const isDirty = title !== baseline.title || content !== baseline.content;

  // In-app navigation (links, Back button): asks before losing changes.
  // Never blocks the redirect to the login page (expired session).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !isSaving &&
      nextLocation.pathname !== "/connexion" &&
      nextLocation.pathname !== currentLocation.pathname,
  );

  // Closing the tab or reloading: the browser shows its own dialog.
  useEffect(() => {
    if (!isDirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [isDirty]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmed = title.trim();
    if (!trimmed) {
      setErrors({ title: "Donne un titre à ta fiche." });
      document.getElementById(titleId)?.focus();
      return;
    }

    const values = { title: trimmed, content };
    setErrors({});
    setIsSaving(true);
    void save(values)
      .then(() => {
        setTitle(values.title);
        setBaseline(values);
        setSavedAt(new Date());
        toast.success("Fiche enregistrée.");
      })
      .catch((error: unknown) => {
        const fields = getFieldErrors(error);
        if (fields.title || fields.content) {
          setErrors({ title: fields.title, content: fields.content });
          if (fields.title) document.getElementById(titleId)?.focus();
          return;
        }
        setFormError(
          isApiError(error)
            ? error.message
            : "Une erreur inattendue est survenue.",
        );
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  let status = "";
  if (isDirty) status = "Modifications non enregistrées";
  else if (savedAt) status = `Enregistrée à ${timeFormat.format(savedAt)}`;

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
      {formError && (
        <p
          role="alert"
          className="rounded-control border-2 border-danger p-3 font-semibold text-danger"
        >
          {formError}
        </p>
      )}

      <Input
        id={titleId}
        label="Titre de la fiche"
        required
        maxLength={MAX_TITLE_LENGTH}
        autoComplete="off"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          if (errors.title)
            setErrors((current) => ({ ...current, title: undefined }));
        }}
        error={errors.title}
      />

      <div className="flex flex-col gap-2">
        <p id={editorLabelId} className="font-semibold">
          Contenu de la fiche
        </p>
        <p id={helpId}>
          Raccourcis : Ctrl+B gras, Ctrl+I italique, Ctrl+U souligné. Dans une
          liste, Tab décale l'élément et Maj+Tab le remonte.
        </p>
        {editor && <EditorToolbar editor={editor} editorId={editorId} />}
        <EditorContent editor={editor} />
        {errors.content && (
          <FieldError id={contentErrorId}>{errors.content}</FieldError>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {/* Always rendered, so each change is announced. */}
        <p role="status">{status}</p>
      </div>

      <Modal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Quitter sans enregistrer ?"
        description="Tes dernières modifications seront perdues."
        footer={
          <>
            <Button onClick={() => blocker.reset?.()}>
              Rester sur la page
            </Button>
            <Button onClick={() => blocker.proceed?.()}>
              Quitter sans enregistrer
            </Button>
          </>
        }
      />
    </form>
  );
}
