import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';

import { _wallet } from '@stores/walletStore';
import type { CredentialRecord } from '@learncard/core';
import CredentialListItem from '@components/CredentialListItem';

const Credentials: React.FC = () => {
    const [credentialsList, setCredentialsList] = useState<CredentialRecord[]>();
    const wallet = useStore(_wallet);

    useEffect(() => {
        if (wallet) wallet.index.all.get().then(setCredentialsList);
    }, [wallet]);

    if (!wallet || !credentialsList) return <></>;

    if(credentialsList.length === 0) {
        return <></>;
    }
    const credentials =
        credentialsList.length === 0 ? (
            <>
                You have no credentials. Hit the "Issue Test Credential" button
                above to add one.
            </>
        ) : (
            credentialsList.map(credential => (
                <CredentialListItem key={credential.title} credential={credential} />
            ))
        );

    return (
        <section className="max-w-5xl w-5/6 border rounded p-4 bg-gray-100">
            <header className="flex gap-2 justify-center items-center border-b pb-2 mb-2">
                <h2>Credentials</h2>
            </header>
            <ul className="flex flex-col gap-2">{credentials}</ul>
        </section>
    );
};

export default Credentials;
