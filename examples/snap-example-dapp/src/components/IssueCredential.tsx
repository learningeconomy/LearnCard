import React, { useState, useEffect } from 'react';
import { UnsignedVC, VC } from '@learncard/types';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const IssueCredential: React.FC = () => {
    const [credential, setCredential] = useState<UnsignedVC>();
    const [response, setResponse] = useState<VC>();
    const [loading, setLoading] = useState(false);

    const isSnapReady = useIsSnapReady();

    const getTestVc = async () => {
        const testVc = await sendRequest({ method: 'getTestVc' });

        if (testVc) setCredential(testVc);
    };

    const issueCredential = async () => {
        if (!credential) return;

        try {
            setLoading(true);

            const vc = await sendRequest({ method: 'issueCredential', credential });

            if (vc) setResponse(vc);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSnapReady) getTestVc();
    }, [isSnapReady]);

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <TextBox
                multiline
                label="Credential:"
                value={JSON.stringify(credential, undefined, 4)}
                onChange={value => setCredential(JSON.parse(value))}
            />

            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={issueCredential}
                disabled={loading}
            >
                {loading ? 'Issuing...' : 'Issue'}
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
