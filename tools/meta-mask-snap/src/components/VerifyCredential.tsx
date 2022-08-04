import React, { useState } from 'react';
import { VC, VerificationItem } from '@learncard/types';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const VerifyCredential: React.FC = () => {
    const [credential, setCredential] = useState<VC>();
    const [response, setResponse] = useState<VerificationItem[]>();

    const isSnapReady = useIsSnapReady();

    const verifyCredential = async () => {
        if (!credential) return;

        const res = await sendRequest({ method: 'verifyCredential', credential });

        if (res) setResponse(res);
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 border rounded flex flex-col gap-2 items-center justify-center">
            <textarea
                className="w-1/2 h-80 p-4"
                onChange={e => setCredential(JSON.parse(e.target.value))}
                value={JSON.stringify(credential, undefined, 4)}
            />
            <button
                className="border rounded bg-blue-200 w-1/2"
                type="button"
                onClick={verifyCredential}
            >
                Verify
            </button>
            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-grey-600 border-b text-center">Response</span>
                    <output className="overflow-auto">
                        <pre>{JSON.stringify(response, undefined, 4)}</pre>
                    </output>
                </section>
            )}
        </section>
    );
};

export default VerifyCredential;
