import React, { useState } from 'react';
import { VC } from '@learncard/types';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const GetCredential: React.FC = () => {
    const [title, setTitle] = useState('test');
    const [response, setResponse] = useState<VC>();

    const isSnapReady = useIsSnapReady();

    const getCredential = async () => {
        if (!title) return;

        try {
            const credential = await sendRequest({ method: 'getCredential', title });

            console.log({ credential });

            if (credential) setResponse(credential);
        } catch (error) {
            console.log({ error });
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <textarea
                className="w-1/2 h-80 p-4"
                onChange={e => setTitle(e.target.value)}
                value={title}
            />
            <button
                className="border rounded bg-blue-200 w-1/2"
                type="button"
                onClick={getCredential}
            >
                Get Credential
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

export default GetCredential;
