import { createContext } from "react";

export type ToastVariant = "success" | "info" | "error";

export type ToastApi = {
  success: (message: string) => void;
  info: (message: string) => void;
  error: (message: string) => void;
};

export const ToastContext = createContext<ToastApi | null>(null);
