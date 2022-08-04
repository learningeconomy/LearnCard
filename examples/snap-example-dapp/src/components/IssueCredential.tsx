import React, { useState, useEffect } from 'react';
import { UnsignedVC, VC } from '@learncard/types';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const IssueCredential: React.FC = () => {
    const [credential, setCredential] = useState<UnsignedVC>();
    const [response, setResponse] = useState<VC>();

    const isSnapReady = useIsSnapReady();

    const getTestVc = async () => {
        const testVc = await sendRequest({ method: 'getTestVc' });

        if (testVc) setCredential(testVc);
    };

    const issueCredential = async () => {
        if (!credential) return;

        try {
            const vc = await sendRequest({ method: 'issueCredential', credential });

            if (vc) setResponse(vc);
        } catch (error) {
            console.log({ error });
        }
    };

    useEffect(() => {
        if (isSnapReady) getTestVc();
    }, [isSnapReady]);

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <textarea
                className="w-1/2 h-80 p-4"
                onChange={e => setCredential(JSON.parse(e.target.value))}
                value={JSON.stringify(credential, undefined, 4)}
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
                        <pre>{JSON.stringify(response, undefined, 4)}</pre>
                    </output>
                </section>
            )}
        </section>
    );
};

export default IssueCredential;
