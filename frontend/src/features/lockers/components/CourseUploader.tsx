import { Upload } from "lucide-react";
import { useId, useState, type ChangeEvent } from "react";

import { getFieldErrors, isApiError } from "@/shared/api";
import { cx } from "@/shared/lib/cx";
import { FieldError } from "@/shared/ui/FieldError";
import { useToast } from "@/shared/ui/toast/useToast";

import { fileSizeLabel } from "../format";
import { useUploadCourse } from "../hooks";

type CourseUploaderProps = {
  lockerId: number;
  maxFileSizeBytes: number | null;
};

function looksLikePdf(file: File): boolean {
  // Convenience only: the server checks the real file signature.
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function CourseUploader({
  lockerId,
  maxFileSizeBytes,
}: CourseUploaderProps) {
  const inputId = useId();
  const helpId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  const upload = useUploadCourse(lockerId);
  const toast = useToast();

  const [error, setError] = useState<string | null>(null);
  const [sendingName, setSendingName] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Lets the student pick the same file again after an error.
    input.value = "";
    if (!file) return;

    setError(null);
    if (!looksLikePdf(file)) {
      setError("Choisis un fichier PDF.");
      return;
    }
    if (maxFileSizeBytes !== null && file.size > maxFileSizeBytes) {
      setError(
        `Ce fichier dépasse la taille maximale autorisée (${fileSizeLabel(maxFileSizeBytes)}).`,
      );
      return;
    }

    setSendingName(file.name);
    upload.mutate(file, {
      onSuccess: (course) => {
        toast.success(`« ${course.title} » a été ajouté à ton casier.`);
      },
      onError: (uploadError) => {
        setError(
          getFieldErrors(uploadError).file ??
            (isApiError(uploadError)
              ? uploadError.message
              : "Une erreur inattendue est survenue."),
        );
      },
      onSettled: () => {
        setSendingName(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        className={cx(
          "inline-flex min-h-tap cursor-pointer items-center gap-2 self-start rounded-control px-4 font-semibold",
          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-current",
          upload.isPending && "cursor-wait opacity-70",
        )}
      >
        <input
          id={inputId}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={upload.isPending}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          onChange={handleChange}
        />
        <Upload aria-hidden="true" className="size-5" />
        Ajouter un cours (PDF)
      </label>

      <p id={helpId}>
        {maxFileSizeBytes === null
          ? "PDF uniquement."
          : `PDF uniquement, ${fileSizeLabel(maxFileSizeBytes)} maximum.`}
      </p>

      {/* Always rendered, so the screen reader announces each change. */}
      <p role="status">{sendingName && `Envoi de ${sendingName}…`}</p>

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
