import { walletFromKey } from '@learncard/core';

import didkit from './didkit_wasm_bg.wasm';

import { OnRpcRequestHandler } from '@metamask/snap-types';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    console.log('SWEET');
    switch (request.method) {
        case 'hello':
            console.log('Hello');

            const nice = await walletFromKey('a', {
                didkit: Uint8Array.from(atob(didkit), c => c.charCodeAt(0)),
            });
            console.log(nice.did());

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
