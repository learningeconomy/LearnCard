import React, { useState } from 'react';
import { VC } from '@learncard/types';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const ReadFromCeramic: React.FC = () => {
    const [id, setId] = useState('kjzl6cwe1jw147ccqylu3242vatawzic5zk5regmt1zzvckryd4ehcd00am16hv');
    const [loading, setLoading] = useState(false);

    const [response, setResponse] = useState<VC>();

    const isSnapReady = useIsSnapReady();

    const readFromCeramic = async () => {
        if (!id) return;

        try {
            setLoading(true);

            const credential = await sendRequest({ method: 'readFromCeramic', id });

            setResponse(credential);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <TextBox label="Stream ID:" value={id} onChange={setId} />

            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={readFromCeramic}
                disabled={loading}
            >
                {loading ? 'Reading...' : 'Read From Ceramic'}
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

export default ReadFromCeramic;
