import { walletFromKey, LearnCardWallet } from '@learncard/core';

import didkit from './didkit_wasm_bg.wasm';

import { OnRpcRequestHandler } from '@metamask/snap-types';

import { MetaMaskInpageProvider } from '@metamask/providers';

// Types that should be available globally within a Snap
declare global {
    const wallet: MetaMaskInpageProvider;
}

let memoizedWallet: LearnCardWallet;

const getWallet = async () => {
    if (memoizedWallet) return memoizedWallet;

    const entropy = await wallet.request({ method: 'snap_getBip44Entropy_60' });

    const newWallet = await walletFromKey(entropy.privateKey, {
        didkit: Uint8Array.from(atob(didkit), c => c.charCodeAt(0)),
    });

    memoizedWallet = newWallet;

    return memoizedWallet;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    const lcWallet = await getWallet();

    switch (request.method) {
        case 'did':
            return lcWallet.did(request.didMethod);
        case 'getTestVc':
            return JSON.stringify(lcWallet.getTestVc());
        case 'issueCredential':
            return JSON.stringify(await lcWallet.issueCredential(JSON.parse(request.credential)));
        case 'verifyCredential':
            return JSON.stringify(await lcWallet.verifyCredential(JSON.parse(request.credential)));
        case 'issuePresentation':
            return JSON.stringify(await lcWallet.issuePresentation(JSON.parse(request.credential)));
        case 'verifyPresentation':
            return JSON.stringify(
                await lcWallet.verifyPresentation(JSON.parse(request.presentation))
            );

        // Unused: I am leaving this here to remind myself how to do this!
        case 'hello':
            const isOkay = wallet.request({
                method: 'snap_confirm',
                params: [
                    {
                        prompt: `Hello, ${origin}!`,
                        description: 'This custom confirmation is just for display purposes.',
                        textAreaContent: `Nice 😎 (${lcWallet.did()})`,
                    },
                ],
            });

            if (isOkay) return 'hello';

            return 'Not allowed!';
        default:
            throw new Error('Method not found.');
    }
};
