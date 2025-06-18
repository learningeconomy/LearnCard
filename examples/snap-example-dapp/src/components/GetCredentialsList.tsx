import React, { useState, useEffect } from 'react';
import type { CredentialRecord } from '@learncard/types';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const GetCredentials: React.FC = () => {
    const [response, setResponse] = useState<CredentialRecord[]>();
    const [loading, setLoading] = useState(false);

    const isSnapReady = useIsSnapReady();

    const getCredentials = async () => {
        try {
            setLoading(true);

            const credentialsList = await sendRequest({ method: 'getCredentialsList' });

            if (credentialsList) setResponse(credentialsList);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSnapReady) getCredentials();
    }, [isSnapReady]);

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={getCredentials}
                disabled={loading}
            >
                {loading ? 'Getting Credentials List...' : 'Get Credentials List'}
            </button>

            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-green-400 border-b text-center">Success!</span>

                    <output className="overflow-auto">
                        <pre>{JSON.stringify(response, undefined, 4)}</pre>
                    </output>
                </section>
            )}
        </section>
    );
};

export default GetCredentials;
