import { walletFromKey } from '@learncard/core';

import { OnRpcRequestHandler } from '@metamask/snap-types';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
    console.log('SWEET');
    switch (request.method) {
        case 'hello':
            console.log('Hello');

            try {
                const nice = await walletFromKey('a');
                console.log(nice.did());
            } catch (error) {
                throw new Error(error);
            }

            return wallet.request({
                method: 'snap_confirm',
                params: [
                    {
                        prompt: `Hello, ${origin}!`,
                        description: 'This custom confirmation is just for display purposes.',
                        textAreaContent: 'Nice 😎',
                    },
                ],
            });
        default:
            throw new Error('Method not found.');
    }
};
