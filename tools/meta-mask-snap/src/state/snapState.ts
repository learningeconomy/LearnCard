import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';

export const isSnapReady = atom(false);
export const useIsSnapReady = () => useStore(isSnapReady);
