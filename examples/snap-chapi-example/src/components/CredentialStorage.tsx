import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { initLearnCard } from '@learncard/init';
import type { CredentialStoreEvent } from '@learncard/chapi-plugin';
import { VCCard } from '@learncard/react';

import '@learncard/react/dist/main.css';

import { _wallet, _seed } from '../stores/walletStore';
import { getCredentialFromVp } from '../helpers/credential.helpers';

const CredentialStorage: React.FC = () => {
    const [event, setEvent] = useState<CredentialStoreEvent>();
    const [title, setTitle] = useState('Test');
    const $wallet = useStore(_wallet);
    const seed = useStore(_seed);

    const presentation = event?.credential?.data;

    const credential = presentation && getCredentialFromVp(presentation);

    const getWallet = async () => {
        const wallet = $wallet || (await initLearnCard({ seed }));

        if (!$wallet) _wallet.set(wallet);

        return wallet;
    };

    useEffect(() => {
        const fetchData = async () => {
            const wallet = await getWallet();

            const _event = await wallet.receiveChapiEvent();

            if ('credential' in _event) setEvent(_event);
        };
        if (seed) fetchData();
    }, []);

    if (!seed) return <h1>Looks like you're logged out! Please log back in and try again</h1>;

    if (!event) return <h1>Loading...</h1>;

    const accept = async () => {
        const wallet = await getWallet();

        const id = await wallet.publishCredential(credential);

        await wallet.addCredential({ title, id });

        event.respondWith(
            Promise.resolve({ dataType: 'VerifiablePresentation', data: presentation })
        );
    };

    const reject = () => event.respondWith(Promise.resolve(null));

    return (
        <form
            onSubmit={e => e.preventDefault()}
            className="w-full h-full flex flex-col justify-center items-center gap-4 p-4"
        >
            <VCCard credential={credential} />

            <fieldset>
                <label className="flex gap-2">
                    Title:
                    <input type="text" onChange={e => setTitle(e.target.value)} value={title} />
                </label>
            </fieldset>

            <fieldset className="flex gap-4">
                <button
                    type="button"
                    className="bg-green-200 rounded border px-4 py-2"
                    onClick={accept}
                >
                    Accept
                </button>
                <button
                    type="button"
                    className="bg-red-200 rounded border px-4 py-2"
                    onClick={reject}
                >
                    Reject
                </button>
            </fieldset>
        </form>
    );
};

export default CredentialStorage;
