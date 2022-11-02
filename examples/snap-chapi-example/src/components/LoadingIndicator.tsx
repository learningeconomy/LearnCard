import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/core';
import detectEthereumProvider from '@metamask/detect-provider';

import { isSnapLoading, useIsSnapLoading, isSnapReady, useIsSnapReady } from '@stores/snapStore';

import { snapId } from '@constants/snapConstants';

const LoadingIndicator: React.FC = () => {
    const [needsFlask, setNeedsFlask] = useState(false);

    const ready = useIsSnapReady();
    const loading = useIsSnapLoading();

    const loadSnap = async () => {
        try {
            const provider: any = await detectEthereumProvider();
            const isFlask = (await provider?.request({ method: 'web3_clientVersion' }))?.includes(
                'flask'
            );

            if (!isFlask) return setNeedsFlask(true);

            isSnapLoading.set(true);

            await ethereum.request({
                method: 'wallet_enable',
                params: [{ wallet_snap: { [snapId]: {} } }],
            });

            const wallet = await initLearnCard();

            await wallet.invoke.installChapiHandler();

            isSnapReady.set(true);
        } catch (error) {
            console.error(error);
            isSnapLoading.set(false);
        }
    };

    useEffect(() => {
        loadSnap();
    }, []);

    if (ready) return <></>;

    if (needsFlask) {
        return (
            <section className="h-full w-full flex items-center justify-center">
                <h1>You need to install MetaMask Flask to use this app!</h1>
                <a href="https://metamask.io/flask/">Click here to install it!</a>
            </section>
        );
    }

    if (!loading) {
        return (
            <section className="h-full w-full flex items-center justify-center">
                <button className="border rounded bg-blue-50 p-4" type="button" onClick={loadSnap}>
                    Click here to load snap
                </button>
            </section>
        );
    }

    return (
        <section className="h-full w-full flex items-center justify-center">
            <h1>Loading snap...</h1>
        </section>
    );
};

export default LoadingIndicator;
