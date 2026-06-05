import { runWithRecovery, type RunWithRecoveryCallbacks } from 'learn-card-base';
import type {
    CredentialOffer,
    AcceptCredentialOfferOptions,
    AcceptedCredentialResult,
    StoreAcceptedCredentialsOptions,
    StoreAcceptedCredentialsResult,
    AuthCodeFlowHandle,
    TokenResponse,
} from '@learncard/openid4vc-plugin';
import type { ProofJwtSigner } from '@learncard/openid4vc-plugin';
import { storeAcceptedCredentials } from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import type { LearnCard } from '@learncard/core';

import {
    buildSignerForStrategy,
    getApplicableSignerStrategies,
    type SignerStrategyId,
} from './signerStrategies';

type WalletInvoke = {
    exchangePreAuthCodeForToken: (
        input: string | CredentialOffer,
        options?: Omit<AcceptCredentialOfferOptions, 'signer'>
    ) => Promise<TokenResponse>;
    requestCredentialsFromPreAuthToken: (options: {
        input: string | CredentialOffer;
        tokenResponse: TokenResponse;
        options?: Omit<AcceptCredentialOfferOptions, 'signer'>;
        signer?: ProofJwtSigner;
    }) => Promise<AcceptedCredentialResult>;
    exchangeAuthCodeForToken: (options: {
        flowHandle: AuthCodeFlowHandle;
        code: string;
        state?: string;
    }) => Promise<TokenResponse>;
    requestCredentialsFromAuthCodeToken: (options: {
        flowHandle: AuthCodeFlowHandle;
        tokenResponse: TokenResponse;
        signer?: ProofJwtSigner;
    }) => Promise<AcceptedCredentialResult>;
};

type ResilientWallet = BespokeLearnCard & { invoke: WalletInvoke };

interface ResilientAcceptAndStoreArgs {
    wallet: ResilientWallet;
    offer: string | CredentialOffer;
    options: Omit<AcceptCredentialOfferOptions & StoreAcceptedCredentialsOptions, 'signer'>;
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
    // Tracks the signer-in-effect across orchestrator iterations so that
    // transport retries (axis !== 'signer') don't silently revert to
    // availableSigners[0] and re-attempt with the signer we already
    // proved broken. Updated only when the orchestrator hands us a new
    // signer strategy.
    let currentSignerId: SignerStrategyId = availableSigners[0];
    // Exchange the single-use pre-auth code lazily — only after a signer
    // is built — and memoize so it happens exactly once across retries.
    // Exchanging before the signer would burn the grant on local signer
    // failure, re-introducing `invalid_grant: Code inactive` on retry.
    let tokenResponse: TokenResponse | undefined;

    const accepted = await runWithRecovery(
        async ({ strategy }) => {
            if (strategy.axis === 'signer') {
                currentSignerId = strategy.id as SignerStrategyId;
            }

            const signer = await buildSignerForStrategy(wallet, currentSignerId);

            tokenResponse ??= await wallet.invoke.exchangePreAuthCodeForToken(offer, options);

            return wallet.invoke.requestCredentialsFromPreAuthToken({
                input: offer,
                tokenResponse,
                options,
                signer,
            });
        },
        { availableSigners },
        callbacks
    );

    const stored = await storeAcceptedCredentials(
        wallet as unknown as LearnCard<any, any, any>,
        accepted,
        options
    );

    return { ...accepted, ...stored };
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
    let currentSignerId: SignerStrategyId = availableSigners[0];
    // Exchange the single-use OAuth code lazily — only after a signer is
    // built — and memoize so it happens exactly once across retries.
    // Exchanging before the signer would burn the grant on local signer
    // failure, re-introducing `invalid_grant: Code inactive` on retry.
    let tokenResponse: TokenResponse | undefined;

    return runWithRecovery(
        async ({ strategy }) => {
            if (strategy.axis === 'signer') {
                currentSignerId = strategy.id as SignerStrategyId;
            }

            const signer = await buildSignerForStrategy(wallet, currentSignerId);

            tokenResponse ??= await wallet.invoke.exchangeAuthCodeForToken({
                flowHandle,
                code,
                state,
            });

            return wallet.invoke.requestCredentialsFromAuthCodeToken({
                flowHandle,
                tokenResponse,
                signer,
            });
        },
        { availableSigners },
        callbacks
    );
};
