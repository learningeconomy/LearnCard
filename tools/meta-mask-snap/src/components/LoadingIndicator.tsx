import React, { useEffect } from 'react';

import { isSnapLoading, useIsSnapLoading, isSnapReady, useIsSnapReady } from '@state/snapState';

import { snapId } from '@constants/snapConstants';

const LoadingIndicator: React.FC = () => {
    const ready = useIsSnapReady();
    const loading = useIsSnapLoading();

    const loadSnap = async () => {
        isSnapLoading.set(true);

        await ethereum.request({
            method: 'wallet_enable',
            params: [{ wallet_snap: { [snapId]: {} } }],
        });

        isSnapReady.set(true);
    };

    useEffect(() => {
        loadSnap();
    }, []);

    if (ready) return <></>;

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
