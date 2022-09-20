import React from 'react';
import { atom } from 'nanostores';
import { useStore } from '@nanostores/react';

export const modalComponent = atom(<></>);
export const useModalStore = () => useStore(modalComponent);
