import { createStore } from '@udecode/zustood';
import React from 'react';

type ModalState = {
    open: boolean;
    name: string | null;
};

const initialState = {
    issueVcModal: { open: false, name: null },
    presentVcModal: { open: false, name: null },
    shareCredsModal: { open: false, name: null },
};

export const modalStateStore = createStore('modalStore')<{
    issueVcModal: ModalState | null;
    presentVcModal: ModalState | null;
    shareCredsModal: ModalState | null;
}>(initialState, { persist: { name: 'modalStore', enabled: true } });
export default modalStateStore;
