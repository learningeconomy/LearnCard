import React, { useContext } from 'react';

import type { ModalInstanceToken } from './types/Modals';

const ModalInstanceContext = React.createContext<ModalInstanceToken | undefined>(undefined);

export const ModalInstanceContextProvider = ModalInstanceContext.Provider;

/** Returns the owning stack entry, or undefined for content rendered outside a modal. */
export const useModalInstance = (): ModalInstanceToken | undefined =>
    useContext(ModalInstanceContext);
