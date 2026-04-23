import React from 'react';
import { createPortal } from 'react-dom';

import { useModalsContext } from './ModalsContext';

import { MODALS } from './modals.helpers';

import { ModalTypes } from './types/Modals';
import { useDeviceTypeByWidth } from '../../hooks/useDeviceTypeByWidth';

export const Modals = () => {
    const { modals } = useModalsContext();

    const { isMobile } = useDeviceTypeByWidth();

    return createPortal(
        modals.map(modal => {
            const type = isMobile ? modal.type.mobile : modal.type.desktop;

            if (type === ModalTypes.None) return <></>;

            const Component = MODALS[type];

            return (
                <Component
                    component={modal.component}
                    options={modal.options}
                    open={modal.open}
                    key={modal.id}
                />
            );
        }),
        document.getElementById('modal-mid-root') as HTMLElement
    );
};

export default Modals;
