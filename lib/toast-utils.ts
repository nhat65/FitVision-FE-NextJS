// lib/toast.ts
import { toast } from "sonner";

type ToastStatus = "success" | "error" | "warning" | "info";

interface ToastOptions {
  status: ToastStatus;
  message: string;
  title?: string;
  duration?: number;
}

export const showToast = ({ status, message, title, duration = 3000 }: ToastOptions) => {
  switch (status) {
    case "success":
      toast.success(message, {
        description: title,
        duration,
      });
      break;
    case "error":
      toast.error(message, {
        description: title,
        duration,
      });
      break;
    case "warning":
      toast.warning(message, {
        description: title,
        duration,
      });
      break;
    case "info":
      toast.info(message, {
        description: title,
        duration,
      });
      break;
  }
};

export const toastSuccess = (message: string, title?: string, duration?: number) => {
  showToast({ status: "success", message, title, duration });
};

export const toastError = (message: string, title?: string, duration?: number) => {
  showToast({ status: "error", message, title, duration });
};

export const toastWarning = (message: string, title?: string, duration?: number) => {
  showToast({ status: "warning", message, title, duration });
};

export const toastInfo = (message: string, title?: string, duration?: number) => {
  showToast({ status: "info", message, title, duration });
};

export const useToast = () => {
  return {
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    show: showToast,
  };
};