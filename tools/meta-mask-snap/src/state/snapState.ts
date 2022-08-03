import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';

export const isSnapLoading = atom(false);
export const useIsSnapLoading = () => useStore(isSnapLoading);

export const isSnapReady = atom(false);
export const useIsSnapReady = () => useStore(isSnapReady);
