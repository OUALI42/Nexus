import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";

import { cx } from "@/shared/lib/cx";

import { ToastContext, type ToastVariant } from "./toast-context";

type ToastData = {
  id: number;
  variant: ToastVariant;
  message: string;
  duration: number | null; // null: stays until dismissed
};

const DURATIONS: Record<ToastVariant, number | null> = {
  success: 5000,
  info: 5000,
  error: null, // errors never vanish on their own
};

const LABELS: Record<ToastVariant, string> = {
  success: "Succès",
  info: "Information",
  error: "Erreur",
};

const ICON_COLORS: Record<ToastVariant, string> = {
  success: "text-success",
  info: "text-primary",
  error: "text-danger",
};

const MAX_TOASTS = 4;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((variant: ToastVariant, message: string) => {
    nextId.current += 1;
    const toast: ToastData = {
      id: nextId.current,
      variant,
      message,
      duration: DURATIONS[variant],
    };
    setToasts((current) => [...current, toast].slice(-MAX_TOASTS));
  }, []);

  const api = useMemo(
    () => ({
      success: (message: string) => {
        show("success", message);
      },
      info: (message: string) => {
        show("info", message);
      },
      error: (message: string) => {
        show("error", message);
      },
    }),
    [show],
  );

  const errors = toasts.filter((toast) => toast.variant === "error");
  const others = toasts.filter((toast) => toast.variant !== "error");

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--nx-bottom-bar)+1rem)] z-50 flex flex-col gap-3 md:inset-x-auto md:right-6 md:bottom-6 md:w-96">
        {/* Live regions stay mounted: content added later gets announced. */}
        <div role="alert" className="flex flex-col gap-3">
          {errors.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
        <div role="status" className="flex flex-col gap-3">
          {others.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext>
  );
}

type ToastItemProps = {
  toast: ToastData;
  onDismiss: (id: number) => void;
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isPaused, setPaused] = useState(false);

  useEffect(() => {
    if (toast.duration === null || isPaused) {
      return;
    }
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast.id, toast.duration, isPaused, onDismiss]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    // Only resume when the focus leaves the whole toast.
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setPaused(false);
    }
  }

  return (
    <div
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={handleBlur}
      className="pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-surface p-4 text-fg shadow-card"
    >
      <ToastIcon variant={toast.variant} />
      <p className="flex-1 pt-0.5">
        <span className="sr-only">{LABELS[toast.variant]} : </span>
        {toast.message}
      </p>
      <button
        type="button"
        aria-label="Fermer la notification"
        onClick={() => {
          onDismiss(toast.id);
        }}
        className="-m-2 flex size-tap shrink-0 items-center justify-center rounded-control text-fg-muted hover:bg-surface-muted hover:text-fg"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ToastIcon({ variant }: { variant: ToastVariant }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cx("mt-0.5 size-6 shrink-0", ICON_COLORS[variant])}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {variant === "success" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.5 2.5L16 9.5" />
        </>
      )}
      {variant === "error" && (
        <>
          <path d="M12 3 2.5 20h19L12 3Z" />
          <path d="M12 10v4M12 17v.5" />
        </>
      )}
      {variant === "info" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8v.5" />
        </>
      )}
    </svg>
  );
}
