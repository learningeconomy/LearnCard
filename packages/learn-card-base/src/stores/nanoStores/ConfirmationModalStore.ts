import { atom } from 'nanostores';

interface ConfirmationModalState {
  isOpen: boolean;
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
  resolvePromise: ((value: boolean) => void) | null;
}

export const confirmationModalState = atom<ConfirmationModalState>({
  isOpen: false,
  message: '',
  onConfirm: null,
  onCancel: null,
  resolvePromise: null,
});

export function showConfirmationModal(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmationModalState.set({
      isOpen: true,
      message,
      onConfirm: () => {
        confirmationModalState.get().resolvePromise?.(true);
        hideConfirmationModal();
      },
      onCancel: () => {
        confirmationModalState.get().resolvePromise?.(false);
        hideConfirmationModal();
      },
      resolvePromise: resolve,
    });
  });
}

export function hideConfirmationModal(): void {
  confirmationModalState.set({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
    resolvePromise: null,
  });
}
