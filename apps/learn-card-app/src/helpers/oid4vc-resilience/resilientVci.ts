import { runWithRecovery, type RunWithRecoveryCallbacks } from 'learn-card-base';
import type {
    CredentialOffer,
    AcceptCredentialOfferOptions,
    AcceptedCredentialResult,
    StoreAcceptedCredentialsOptions,
    StoreAcceptedCredentialsResult,
    AuthCodeFlowHandle,
} from '@learncard/openid4vc-plugin';
import type { ProofJwtSigner } from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import {
    buildSignerForStrategy,
    getApplicableSignerStrategies,
    type SignerStrategyId,
} from './signerStrategies';

type WalletInvoke = {
    acceptAndStoreCredentialOffer: (
        input: string | CredentialOffer,
        options: AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions
    ) => Promise<AcceptedCredentialResult & StoreAcceptedCredentialsResult>;
    completeCredentialOfferAuthCode: (options: {
        flowHandle: AuthCodeFlowHandle;
        code: string;
        state?: string;
        signer?: ProofJwtSigner;
    }) => Promise<AcceptedCredentialResult>;
};

type ResilientWallet = BespokeLearnCard & { invoke: WalletInvoke };

interface ResilientAcceptAndStoreArgs {
    wallet: ResilientWallet;
    offer: string | CredentialOffer;
    options: Omit<
        AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions,
        'signer'
    >;
    callbacks?: RunWithRecoveryCallbacks;
}

/**
 * Drop-in replacement for `wallet.invoke.acceptAndStoreCredentialOffer`
 * that wraps the plugin call in the resilience orchestrator. On
 * signer-resolution failures (e.g. walt.id can't read our did:web
 * doc) it falls back through `getApplicableSignerStrategies` order.
 * On transport errors it retries with exponential backoff. On
 * non-recoverable errors it re-throws the original error so existing
 * error UIs (ExchangeErrorDisplay) keep working unchanged.
 */
export const resilientAcceptAndStoreCredentialOffer = async ({
    wallet,
    offer,
    options,
    callbacks,
}: ResilientAcceptAndStoreArgs): Promise<
    AcceptedCredentialResult & StoreAcceptedCredentialsResult
> => {
    const availableSigners = getApplicableSignerStrategies(wallet);

    return runWithRecovery(
        async ({ strategy }) => {
            const signerStrategyId: SignerStrategyId =
                strategy.axis === 'signer'
                    ? (strategy.id as SignerStrategyId)
                    : availableSigners[0];

            const signer = await buildSignerForStrategy(wallet, signerStrategyId);

            return wallet.invoke.acceptAndStoreCredentialOffer(offer, {
                ...options,
                signer,
            });
        },
        { availableSigners },
        callbacks
    );
};

interface ResilientCompleteAuthCodeArgs {
    wallet: ResilientWallet;
    flowHandle: AuthCodeFlowHandle;
    code: string;
    state?: string;
    callbacks?: RunWithRecoveryCallbacks;
}

/**
 * Resilient wrapper for the auth-code RETURN leg
 * (`completeCredentialOfferAuthCode`). Same fallback semantics as
 * `resilientAcceptAndStoreCredentialOffer`.
 */
export const resilientCompleteCredentialOfferAuthCode = async ({
    wallet,
    flowHandle,
    code,
    state,
    callbacks,
}: ResilientCompleteAuthCodeArgs): Promise<AcceptedCredentialResult> => {
    const availableSigners = getApplicableSignerStrategies(wallet);

    return runWithRecovery(
        async ({ strategy }) => {
            const signerStrategyId: SignerStrategyId =
                strategy.axis === 'signer'
                    ? (strategy.id as SignerStrategyId)
                    : availableSigners[0];

            const signer = await buildSignerForStrategy(wallet, signerStrategyId);

            return wallet.invoke.completeCredentialOfferAuthCode({
                flowHandle,
                code,
                state,
                signer,
            });
        },
        { availableSigners },
        callbacks
    );
};
