import React, { useState } from 'react';
import { VC, VP } from '@learncard/types';

import TextBox from '@components/input/TextBox';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const IssuePresentation: React.FC = () => {
    const [credential, setCredential] = useState<VC>({
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: 'http://example.org/credentials/3731',
        type: ['VerifiableCredential'],
        issuer: 'did:key:z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8',
        issuanceDate: '2020-08-19T21:41:50Z',
        credentialSubject: { id: 'did:example:d23dd687a7dc6787646f2eb98d0' },
        proof: {
            type: 'Ed25519Signature2018',
            created: '2022-08-10T04:43:47.376Z',
            proofPurpose: 'assertionMethod',
            verificationMethod:
                'did:key:z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8#z6MkjgL1J895LHXCtgjaQ7rdfTHQFZWuZEV9aJAY8sgeJjG8',
            jws: 'eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..8VbqDuusArFw80UueeaZ2gCOkPhcU0uedOM-Ae_aZUpA_ahCjs_KRTqG75NoeAGG9B1Yr8fVUi39r74wQxh2CQ',
        },
    });
    const [response, setResponse] = useState<VP>();
    const [loading, setLoading] = useState(false);

    const isSnapReady = useIsSnapReady();

    const issuePresentation = async () => {
        if (!credential) return;

        try {
            setLoading(true);
            const res = await sendRequest({ method: 'issuePresentation', credential });

            if (res) setResponse(res);
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
                onClick={issuePresentation}
                disabled={loading}
            >
                {loading ? 'Issuing...' : 'Issue'}
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

export default IssuePresentation;
