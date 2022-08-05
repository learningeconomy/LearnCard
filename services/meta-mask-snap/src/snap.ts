import { z } from 'zod';
import { walletFromKey, LearnCardWallet, DidMethod } from '@learncard/core';
import { OnRpcRequestHandler } from '@metamask/snap-types';
import { MetaMaskInpageProvider } from '@metamask/providers';

import { LearnCardRPCAPI } from './index.ts';

import didkit from './didkit_wasm_bg.wasm';
import { RPCMethod } from '../src/types/helpers';

const serializeResponse = async <Serializer extends RPCMethod>(
    serializer: Serializer,
    data: z.infer<Serializer['returnValue']['validator']>
) => {
    const serializedResult = await serializer.returnValue.serializer.spa(data);

    if (!serializedResult.success) throw new Error('Internal Error');

    return serializedResult.data;
};

// Types that should be available globally within a Snap
declare global {
    const wallet: MetaMaskInpageProvider;
}

let memoizedWallet: LearnCardWallet;

const getWallet = async () => {
    if (memoizedWallet) return memoizedWallet;

    const entropy = await wallet.request<{ publicKey: string; privateKey: string }>({
        method: 'snap_getBip44Entropy_60',
    });

    const newWallet = await walletFromKey(entropy.privateKey, {
        didkit: Uint8Array.from(atob(didkit), c => c.charCodeAt(0)),
    });

    memoizedWallet = newWallet;

    return memoizedWallet;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request: _request }) => {
    const result = await LearnCardRPCAPI.deserializer.spa(_request);

    if (!result.success) throw new Error('Invalid Request');

    const request = result.data;

    const lcWallet = await getWallet();

    if (request.method === 'did') {
        return serializeResponse(LearnCardRPCAPI.did, lcWallet.did(request.didMethod as DidMethod));
    }

    if (request.method === 'getTestVc')
        return serializeResponse(LearnCardRPCAPI.getTestVc, lcWallet.getTestVc());

    if (request.method === 'issueCredential') {
        const permission = await wallet.request({
            method: 'snap_confirm',
            params: [
                {
                    prompt: 'Issuing Credential',
                    description: 'Would you like to issue the following credential?',
                    textAreaContent: JSON.stringify(request.credential, undefined, 4).slice(
                        0,
                        1800
                    ),
                },
            ],
        });

        if (permission) {
            return serializeResponse(
                LearnCardRPCAPI.issueCredential,
                await lcWallet.issueCredential(request.credential)
            );
        }

        throw new Error('Did not get permission to issue credential');
    }

    if (request.method === 'verifyCredential') {
        return serializeResponse(
            LearnCardRPCAPI.verifyCredential,
            await lcWallet.verifyCredential(request.credential)
        );
    }

    if (request.method === 'issuePresentation') {
        const permission = await wallet.request({
            method: 'snap_confirm',
            params: [
                {
                    prompt: 'Issuing Presentation',
                    description: 'Would you like to issue the following presentation?',
                    textAreaContent: JSON.stringify(request.credential, undefined, 4).slice(
                        0,
                        1800
                    ),
                },
            ],
        });

        if (permission) {
            return serializeResponse(
                LearnCardRPCAPI.issuePresentation,
                await lcWallet.issuePresentation(request.credential)
            );
        }

        throw new Error('Did not get permission to issue credential');
    }

    if (request.method === 'verifyPresentation') {
        return serializeResponse(
            LearnCardRPCAPI.verifyPresentation,
            await lcWallet.verifyPresentation(request.presentation)
        );
    }

    throw new Error('Method not found.');
};
