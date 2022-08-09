import { z } from 'zod';
import { walletFromKey, LearnCardWallet, DidMethod } from '@learncard/core';
import { OnRpcRequestHandler } from '@metamask/snap-types';
import { MetaMaskInpageProvider } from '@metamask/providers';

import { LearnCardRPCAPI, LearnCardRPCAPITypes } from './';

import didkit from './didkit_wasm_bg.wasm';
import { RPCMethod } from './types/helpers';

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

const HANDLERS: {
    [Method in LearnCardRPCAPITypes[keyof LearnCardRPCAPITypes]['method']]: (
        lcWallet: LearnCardWallet,
        request: LearnCardRPCAPITypes[Method]['arguments']['deserializer']
    ) => Promise<LearnCardRPCAPITypes[Method]['returnValue']['serializer']>;
} = {
    did: async (lcWallet, request) => {
        return serializeResponse(LearnCardRPCAPI.did, lcWallet.did(request.didMethod as DidMethod));
    },

    getTestVc: async lcWallet => {
        return serializeResponse(LearnCardRPCAPI.getTestVc, lcWallet.getTestVc());
    },

    issueCredential: async (lcWallet, request) => {
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
    },

    verifyCredential: async (lcWallet, request) => {
        return serializeResponse(
            LearnCardRPCAPI.verifyCredential,
            await lcWallet.verifyCredential(request.credential)
        );
    },

    issuePresentation: async (lcWallet, request) => {
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
    },

    verifyPresentation: async (lcWallet, request) => {
        return serializeResponse(
            LearnCardRPCAPI.verifyPresentation,
            await lcWallet.verifyPresentation(request.presentation)
        );
    },

    getCredential: async (lcWallet, request) => {
        return serializeResponse(
            LearnCardRPCAPI.getCredential,
            (await lcWallet.getCredential(request.title)) ?? null
        );
    },
};

let memoizedWallet: LearnCardWallet;

const getWallet = async () => {
    if (memoizedWallet) return memoizedWallet;

    const entropy = await wallet.request<{ publicKey: string; privateKey: string }>({
        method: 'snap_getBip44Entropy_60',
    });

    if (!entropy?.privateKey) throw new Error('Could not get wallet entropy');

    const newWallet = await walletFromKey(entropy.privateKey, {
        didkit: Uint8Array.from(window.atob(didkit), c => c.charCodeAt(0)),
    });

    memoizedWallet = newWallet;

    return memoizedWallet;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request: _request }) => {
    const result = await LearnCardRPCAPI.deserializer.spa(_request);

    if (!result.success) throw new Error('Invalid Request');

    const request = result.data;

    const lcWallet = await getWallet();

    // TS can't tell that the request object is the same as the handler (because they both get typed
    // as unions with all valid methods), so we simply cast to any to defeat that warning since we
    // know that we have correctly selected the correct request handler for the request's method
    return HANDLERS[request.method](lcWallet, request as any);
};
