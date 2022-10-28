import { z } from 'zod';
import { initLearnCard, LearnCardFromKey, DidMethod } from '@learncard/core';
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

    if (!serializedResult.success) {
        console.error(serializedResult.error);
        throw new Error('Internal Error');
    }

    return serializedResult.data;
};

// Types that should be available globally within a Snap
declare global {
    const wallet: MetaMaskInpageProvider;
}

const HANDLERS: {
    [Method in LearnCardRPCAPITypes[keyof LearnCardRPCAPITypes]['method']]: (
        lc: LearnCardFromKey,
        request: LearnCardRPCAPITypes[Method]['arguments']['deserializer']
    ) => Promise<LearnCardRPCAPITypes[Method]['returnValue']['serializer']>;
} = {
    did: async (learnCard, request) => {
        return serializeResponse(
            LearnCardRPCAPI.did,
            learnCard.id.did(request.didMethod as DidMethod)
        );
    },

    getTestVc: async learnCard => {
        return serializeResponse(LearnCardRPCAPI.getTestVc, learnCard.invoke.getTestVc());
    },

    issueCredential: async (learnCard, request) => {
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
                await learnCard.invoke.issueCredential(request.credential)
            );
        }

        throw new Error('Did not get permission to issue credential');
    },

    verifyCredential: async (learnCard, request) => {
        return serializeResponse(
            LearnCardRPCAPI.verifyCredential,
            await learnCard.invoke.verifyCredential(request.credential, {}, true)
        );
    },

    issuePresentation: async (learnCard, request) => {
        const permission = await wallet.request({
            method: 'snap_confirm',
            params: [
                {
                    prompt: 'Issuing Presentation',
                    description: 'Would you like to issue the following presentation?',
                    textAreaContent: JSON.stringify(request.presentation, undefined, 4).slice(
                        0,
                        1800
                    ),
                },
            ],
        });

        if (permission) {
            return serializeResponse(
                LearnCardRPCAPI.issuePresentation,
                await learnCard.invoke.issuePresentation(request.presentation)
            );
        }

        throw new Error('Did not get permission to issue credential');
    },

    verifyPresentation: async (learnCard, request) => {
        return serializeResponse(
            LearnCardRPCAPI.verifyPresentation,
            await learnCard.invoke.verifyPresentation(request.presentation)
        );
    },

    getCredential: async (learnCard, request) => {
        const uri = (await learnCard.index.all.get()).find(
            record => record.id === request.title
        )?.uri;

        return serializeResponse(
            LearnCardRPCAPI.getCredential,
            (await learnCard.read.get(uri)) ?? null
        );
    },

    getCredentials: async learnCard => {
        return serializeResponse(
            LearnCardRPCAPI.getCredentials,
            await learnCard.invoke.getVerifiableCredentialsFromIdx()
        );
    },

    getCredentialsList: async learnCard => {
        return serializeResponse(
            LearnCardRPCAPI.getCredentialsList,
            await learnCard.index.all.get()
        );
    },

    publishCredential: async (learnCard, request) => {
        return serializeResponse(
            LearnCardRPCAPI.publishCredential,
            await learnCard.store.Ceramic.upload(request.credential)
        );
    },

    addCredential: async (learnCard, request) => {
        await learnCard.index.IDX.add({ id: request.title, uri: request.id });

        return serializeResponse(LearnCardRPCAPI.addCredential, null);
    },

    removeCredential: async (learnCard, request) => {
        await learnCard.index.IDX.remove(request.title);

        return serializeResponse(LearnCardRPCAPI.removeCredential, null);
    },

    readFromCeramic: async (learnCard, request) => {
        return serializeResponse(
            LearnCardRPCAPI.readFromCeramic,
            await learnCard.read.get(request.id)
        );
    },
};

let memoizedLearnCard: LearnCardFromKey;

const getLearnCard = async () => {
    if (memoizedLearnCard) return memoizedLearnCard;

    const entropy = await wallet.request<{ publicKey: string; privateKey: string }>({
        method: 'snap_getBip44Entropy_60',
    });

    if (!entropy?.privateKey) throw new Error('Could not get wallet entropy');

    const newLearnCard = await initLearnCard({
        seed: entropy.privateKey,
        didkit: Uint8Array.from(window.atob(didkit), c => c.charCodeAt(0)),
    });

    memoizedLearnCard = newLearnCard;

    return memoizedLearnCard;
};

export const onRpcRequest: OnRpcRequestHandler = async ({ request: _request }) => {
    const result = await LearnCardRPCAPI.deserializer.spa(_request);

    if (!result.success) throw new Error('Invalid Request');

    const request = result.data;

    const learnCard = await getLearnCard();

    // TS can't tell that the request object is the same as the handler (because they both get typed
    // as unions with all valid methods), so we simply cast to any to defeat that warning since we
    // know that we have correctly selected the correct request handler for the request's method
    return HANDLERS[request.method](learnCard, request as any);
};
