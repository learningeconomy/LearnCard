import React, { useState } from 'react';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const VerifyPresentation: React.FC = () => {
    const [presentation, setPresentation] = useState('');
    const [response, setResponse] = useState('');

    const isSnapReady = useIsSnapReady();

    const verifyPresentation = async () => {
        const res = await sendRequest({ method: 'verifyPresentation', presentation });

        if (typeof res === 'string') {
            setResponse(JSON.stringify(JSON.parse(res), undefined, 4));
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 border rounded flex flex-col gap-2 items-center justify-center">
            <textarea
                className="w-1/2 h-80 p-4"
                onChange={e => setPresentation(e.target.value)}
                value={presentation}
            />
            <button
                className="border rounded bg-blue-200 w-1/2"
                type="button"
                onClick={verifyPresentation}
            >
                Verify
            </button>
            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-grey-600 border-b text-center">Response</span>
                    <output className="overflow-auto">
                        <pre>{response}</pre>
                    </output>
                </section>
            )}
        </section>
    );
};

export default VerifyPresentation;
