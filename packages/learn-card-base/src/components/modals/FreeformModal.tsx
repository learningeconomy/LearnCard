import React from 'react';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

export const FreeformModal: ModalContainer = ({ component, options, open }) => {
    return (
        <aside className={`freeform-modal ${options?.className ?? ''} ${open ? 'open' : 'closed'}`}>
            <GenericErrorBoundary>{component}</GenericErrorBoundary>
        </aside>
    );
};

export default FreeformModal;
