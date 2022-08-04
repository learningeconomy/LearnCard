import React, { useState, useEffect } from 'react';
import { DidMethod } from '@learncard/core';

import DidSelector from '@components/DidSelector';

import { useIsSnapReady } from '@state/snapState';

import { sendRequest } from '@helpers/rpc.helpers';

const Did: React.FC = () => {
    const [did, setDid] = useState('');
    const [didMethod, setDidMethod] = useState<DidMethod>('key');

    const isSnapReady = useIsSnapReady();

    const getDid = async (method: DidMethod = 'key') => {
        setDidMethod(method);

        const _did = await sendRequest({ method: 'did', didMethod: method });

        if (typeof _did === 'string') setDid(_did);
    };

    useEffect(() => {
        if (isSnapReady) getDid();
    }, [isSnapReady]);

    if (!isSnapReady) return <></>;

    return (
        <section>
            {did ? (
                <DidSelector did={did} didMethod={didMethod} onChange={getDid} />
            ) : (
                <span>Loading did...</span>
            )}
        </section>
    );
};

export default Did;
