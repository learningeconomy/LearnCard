import React, { useState, useEffect } from 'react';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const AddCredential: React.FC = () => {
    const [title, setTitle] = useState('test');
    const [id, setId] = useState('kjzl6cwe1jw147ccqylu3242vatawzic5zk5regmt1zzvckryd4ehcd00am16hv');
    const [loading, setLoading] = useState(false);

    const [added, setAdded] = useState(false);

    const isSnapReady = useIsSnapReady();

    const addCredential = async () => {
        if (!title) return;

        try {
            setLoading(true);

            await sendRequest({ method: 'addCredential', title, id });

            setAdded(true);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => setAdded(false), [title, id]); // reset success message when editing fields

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 flex flex-col gap-2 items-center justify-center">
            <TextBox label="Title:" value={title} onChange={setTitle} />

            <TextBox label="Stream ID:" value={id} onChange={setId} />

            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={addCredential}
                disabled={loading}
            >
                {loading ? 'Adding Credential...' : 'Add Credential'}
            </button>

            {added && (
                <section className="w-full bg-gray-100 rounded border flex flex-col gap-2">
                    <span className="text-green-400 border-b text-center">Success!</span>
                </section>
            )}
        </section>
    );
};

export default AddCredential;
