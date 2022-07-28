import { walletFromKey, LearnCardWallet } from '@learncard/core';

import didkit from './didkit_wasm_bg.wasm';

import { OnRpcRequestHandler } from '@metamask/snap-types';

let memoizedWallet: LearnCardWallet;

const getWallet = async () => {
    if (memoizedWallet) return memoizedWallet;

    console.log('Making new wallet');

    const newWallet = await walletFromKey('a', {
        didkit: Uint8Array.from(atob(didkit), c => c.charCodeAt(0)),
    });

    memoizedWallet = newWallet;

    return memoizedWallet;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    const nice = await getWallet();

    switch (request.method) {
        case 'hello':
            return wallet.request({
                method: 'snap_confirm',
                params: [
                    {
                        prompt: `Hello, ${origin}!`,
                        description: 'This custom confirmation is just for display purposes.',
                        textAreaContent: `Nice 😎 (${nice.did()})`,
                    },
                ],
            });
        default:
            throw new Error('Method not found.');
    }
};
