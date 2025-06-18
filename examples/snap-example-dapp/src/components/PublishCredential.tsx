import React, { useState } from 'react';
import type { VC } from '@learncard/types';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const PublishCredential: React.FC = () => {
    const [credential, setCredential] = useState<VC>({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'http://example.org/credentials/3731',
        type: ['VerifiableCredential'],
        issuer: 'did:key:z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8',
        issuanceDate: '2020-08-19T21:41:50Z',
        credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
        proof: {
            type: 'Ed25519Signature2018',
            created: '2022-08-10T04:30:03.118Z',
            proofPurpose: 'assertionMethod',
            verificationMethod:
                'did:key:z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8#z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8',
            jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..I6sxbX-NEzehoCXGYPiBOIjlL1QAYBek93zn_cza8Q3AH_3k1rMCOu2uJ-4PTOgjt75OiJL4Z3RciBShrHZyCw',
        },
    });
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);

    const isSnapReady = useIsSnapReady();

    const puiblishCredential = async () => {
        if (!credential) return;

        try {
            setResponse('');
            setLoading(true);

            const res = await sendRequest({ method: 'publishCredential', credential });

            if (res) {
                setResponse(res);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isSnapReady) return <></>;

    return (
        <section className="p-2 border rounded flex flex-col gap-2 items-center justify-center">
            <TextBox
                multiline
                label="Credential:"
                value={JSON.stringify(credential, undefined, 4)}
                onChange={value => setCredential(JSON.parse(value))}
            />

            <button
                className={`border rounded w-1/2 ${loading ? 'bg-gray-300' : 'bg-blue-200'}`}
                type="button"
                onClick={puiblishCredential}
                disabled={loading}
            >
                {loading ? 'Publishing...' : 'Publish'}
            </button>

            {response && (
                <section className="w-full bg-gray-100 rounded border flex flex-col items-center gap-2">
                    <span className="text-grey-600 border-b text-center">Response</span>

                    <output className="overflow-auto">{response}</output>
                </section>
            )}
        </section>
    );
};

export default PublishCredential;
