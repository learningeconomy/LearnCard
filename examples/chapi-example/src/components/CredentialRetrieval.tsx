import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import type { CredentialRequestEvent } from '@learncard/chapi-plugin';
import { initLearnCard } from '@learncard/init';

import '@learncard/react/dist/main.css';

import { _wallet, _seed } from '@stores/walletStore';

const CredentialStorage: React.FC = () => {
    const [event, setEvent] = useState<CredentialRequestEvent>();
    const $wallet = useStore(_wallet);
    const seed = useStore(_seed);

    const getWallet = async () => {
        const wallet = $wallet || (await initLearnCard({ seed }));

        if (!$wallet) _wallet.set(wallet);

        return wallet;
    };

    useEffect(() => {
        const fetchData = async () => {
            const wallet = await getWallet();

            const _event = await wallet.invoke.receiveChapiEvent();

            if ('credentialRequestOptions' in _event) setEvent(_event);
        };
        if (seed) fetchData();
    }, []);

    if (!seed) return <h1>Looks like you're logged out! Please log back in and try again</h1>;

    if (!event) return <h1>Loading...</h1>;

    const origin = event.credentialRequestOrigin;
    const presentation = event?.credentialRequestOptions?.web?.VerifiablePresentation;

    const query = Array.isArray(presentation.query) ? presentation.query[0] : presentation.query;

    const accept = async () => {
        const wallet = await getWallet();

        if (query.type === 'DIDAuthentication') {
            const { challenge, domain } = presentation;

            event.respondWith(
                Promise.resolve({
                    dataType: 'VerifiablePresentation',
                    data: await wallet.invoke.issuePresentation(await wallet.invoke.getTestVp(), {
                        challenge,
                        domain,
                        proofPurpose: 'authentication',
                    }),
                })
            );
        }
    };

    const reject = () => event.respondWith(Promise.resolve(null));

    return (
        <form
            onSubmit={e => e.preventDefault()}
            className="w-full h-full flex flex-col justify-center items-center gap-4 p-4"
        >
            <section>
                <h3>{`${origin} would like to send you a credential`}</h3>
            </section>

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
