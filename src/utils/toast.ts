import { toast, ToastOptions } from 'react-toastify';

// Default toast configuration
const defaultToastConfig: ToastOptions = {
  position: 'top-center',
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Toast utility functions
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  toast.success(message, { ...defaultToastConfig, ...options });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  toast.error(message, { ...defaultToastConfig, ...options });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  toast.info(message, { ...defaultToastConfig, ...options });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  toast.warning(message, { ...defaultToastConfig, ...options });
};

// Generic toast
export const showToast = (message: string, options?: ToastOptions) => {
  toast(message, { ...defaultToastConfig, ...options });
};

