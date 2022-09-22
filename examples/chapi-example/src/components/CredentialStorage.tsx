import React, { useState, useEffect } from 'react';
import { initLearnCard, CredentialStoreEvent } from '@learncard/core';
import { VCCard } from '@learncard/react';

import '@learncard/react/dist/base.css';
import '@learncard/react/dist/main.css';

import { getCredentialFromVp } from '../helpers/credential.helpers';

const CredentialStorage: React.FC = () => {
    const [event, setEvent] = useState<CredentialStoreEvent>();

    const presentation = event?.credential?.data;

    const credential = presentation && getCredentialFromVp(presentation);

    useEffect(() => {
        const fetchData = async () => {
            const wallet = await initLearnCard({ seed: 'a' });

            const _event = await wallet.receiveChapiEvent();

            if ('credential' in _event) setEvent(_event);
        };
        fetchData();
    }, []);

    if (!event) return <h1>Loading...</h1>;

    const accept = () => {
        event.respondWith(
            Promise.resolve({ dataType: 'VerifiablePresentation', data: presentation })
        );
    };

    const reject = () => event.respondWith(Promise.resolve(null));
    return (
        <section>
            <VCCard credential={credential} />
            <button type="button" onClick={accept}>
                Accept
            </button>
            <button type="button" onClick={reject}>
                Reject
            </button>
        </section>
    );
};

export default CredentialStorage;
