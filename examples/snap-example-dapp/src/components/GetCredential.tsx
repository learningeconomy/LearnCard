import React, { useState } from 'react';
import type { VC } from '@learncard/types';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const GetCredential: React.FC = () => {
    const [title, setTitle] = useState('test');
    const [response, setResponse] = useState<VC | 'no-credential'>();
    const [loading, setLoading] = useState(false);

    const isSnapReady = useIsSnapReady();

    const getCredential = async () => {
        if (!title) return;

        try {
            setLoading(true);

            const credential = await sendRequest({ method: 'getCredential', title });

            if (credential) setResponse(credential);
            else setResponse('no-credential');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <TextBox label="Title:" onChange={setTitle} value={title} />

            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={getCredential}
                disabled={loading}
            >
                {loading ? 'Getting Credential...' : 'Get Credential'}
            </button>

            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-green-400 border-b text-center">Success!</span>

                    <output className="overflow-auto">
                        {typeof response === 'string' ? (
                            <span>No Credential Found!</span>
                        ) : (
                            <pre>{JSON.stringify(response, undefined, 4)}</pre>
                        )}
                    </output>
                </section>
            )}
        </section>
    );
};

export default GetCredential;
