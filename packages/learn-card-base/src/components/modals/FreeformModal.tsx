import React from 'react';

import { ModalContainer } from './types/Modals';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

export const FreeformModal: ModalContainer = ({ component, options, open }) => {
    return (
        <aside
            className={`freeform-modal ${options?.className ?? ''} ${open ? 'open' : 'closed'} ${
                options?.hideDimmer ? 'hide-dimmer' : ''
            }`}
        >
            <div
                className={`freeform-section ${options?.widen ? 'widen' : ''} ${
                    options?.addShadow ? 'add-shadow' : ''
                } ${options?.sectionClassName ?? ''}`}
            >
                <GenericErrorBoundary>{component}</GenericErrorBoundary>
            </div>
        </aside>
    );
};

export default FreeformModal;
