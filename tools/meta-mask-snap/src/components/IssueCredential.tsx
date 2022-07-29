import React, { useState, useEffect } from 'react';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const IssueCredential: React.FC = () => {
    const [credential, setCredential] = useState('{}');
    const [response, setResponse] = useState('');

    const isSnapReady = useIsSnapReady();

    const getTestVc = async () => {
        const testVc = await sendRequest({ method: 'getTestVc' });

        if (typeof testVc === 'string') {
            setCredential(JSON.stringify(JSON.parse(testVc), undefined, 4));
        }
    };

    const issueCredential = async () => {
        const vc = await sendRequest({ method: 'issueCredential', credential });

        if (typeof vc === 'string') {
            setResponse(JSON.stringify(JSON.parse(vc), undefined, 4));
        }
    };

    useEffect(() => {
        if (isSnapReady) getTestVc();
    }, [isSnapReady]);

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
                onClick={issueCredential}
            >
                Issue
            </button>
            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-green-400 border-b text-center">Success!</span>
                    <output className="overflow-auto">
                        <pre>{response}</pre>
                    </output>
                </section>
            )}
        </section>
    );
};

export default IssueCredential;
