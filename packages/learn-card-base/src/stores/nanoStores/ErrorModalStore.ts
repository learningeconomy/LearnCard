import { atom } from 'nanostores';

type ErrorModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose?: () => void;
};

export const errorModalState = atom<ErrorModalState>({
  isOpen: false,
  title: '',
  message: '',
});

export function showErrorModal(title: string, message: string, onClose?: () => void) {
  errorModalState.set({
    isOpen: true,
    title,
    message,
    onClose,
  });
}

export function hideErrorModal() {
  const currentState = errorModalState.get();
  if (currentState.onClose) {
    currentState.onClose();
  }
  errorModalState.set({
    isOpen: false,
    title: '',
    message: '',
  });
}
