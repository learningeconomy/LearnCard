import React, { useState } from 'react';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const IssuePresentation: React.FC = () => {
    const [credential, setCredential] = useState('');
    const [response, setResponse] = useState('');

    const isSnapReady = useIsSnapReady();

    const issuePresentation = async () => {
        const res = await sendRequest({ method: 'issuePresentation', credential });

        if (typeof res === 'string') {
            setResponse(JSON.stringify(JSON.parse(res), undefined, 4));
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 border rounded flex flex-col gap-2 items-center justify-center">
            <textarea
                className="w-1/2 h-80 p-4"
                onChange={e => setCredential(e.target.value)}
                value={credential}
            />
            <button
                className="border rounded bg-blue-200 w-1/2"
                type="button"
                onClick={issuePresentation}
            >
                Issue
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

export default IssuePresentation;
