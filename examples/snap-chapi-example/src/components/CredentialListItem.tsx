import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type { CredentialRecord, VC } from '@learncard/core';

import CredentialModal from './CredentialModal';

import { _wallet } from '../stores/walletStore';

export type CredentialListItemProps = {
    credential: CredentialRecord;
};

const CredentialListItem: React.FC<CredentialListItemProps> = ({ credential: idxCredential }) => {
    const [credential, setCredential] = useState<VC>();
    const [active, setActive] = useState(false);
    const wallet = useStore(_wallet);

    useEffect(() => {
        if (wallet && active && !credential) {
            wallet.readFromCeramic(idxCredential.id).then(setCredential);
        }
    });

    const deleteCredential = async () => {
        if (!wallet) return;

        if (confirm('Are you sure you want to delete this credential?')) {
            await wallet.removeCredential(idxCredential.title);
            window.location.reload();
        }
    };

    let displayValue = idxCredential.title;

    if (active) {
        displayValue = credential ? (
            <CredentialModal credential={credential} onClose={() => setActive(false)} />
        ) : (
            'Loading...'
        );
    }

    return (
        <li className="rounded flex items-center overflow-hidden">
            <button
                type="button"
                onClick={active ? undefined : () => setActive(true)}
                className="w-full h-full bg-blue-100 py-2"
            >
                {displayValue}
            </button>

            <button
                type="button"
                onClick={deleteCredential}
                className="h-full bg-red-500 text-white border-l border-gray-300 p-2"
            >
                Delete
            </button>
        </li>
    );
};

export default CredentialListItem;
