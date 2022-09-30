import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { VC } from '@learncard/core';
import { VCCard } from '@learncard/react';

import '@learncard/react/dist/main.css';

type CredentialModalProps = {
    credential: VC;
    onClose: () => void;
};

const CredentialModal: React.FC<CredentialModalProps> = ({ credential, onClose }) => {
    const [hide, setHide] = useState(false);

    const close = () => {
        onClose();
        setHide(true);
    };

    if (hide) return <></>;

    return createPortal(
        <aside className="fixed w-full h-full top-0 left-0 flex items-center justify-center">
            <button
                type="button"
                onClick={close}
                className="absolute w-full h-full bg-black opacity-50"
            />
            <section className="relative z-10">
                <VCCard credential={credential} />
            </section>
        </aside>,
        document.getElementById('modal-container') as HTMLElement
    );
};

export default CredentialModal;
