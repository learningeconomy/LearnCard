import { runWithRecovery, type RunWithRecoveryCallbacks } from 'learn-card-base';
import type {
    AuthorizationRequest,
    ChosenForPresentation,
    PreparedPresentation,
    SignIdTokenResult,
    SignPresentationResult,
    SubmitPresentationResult,
    BuiltDcqlPresentation,
    DcqlSignedPresentation,
} from '@learncard/openid4vc-plugin';
import type { ProofJwtSigner } from '@learncard/openid4vc-plugin';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import {
    buildSignerForStrategy,
    getApplicableSignerStrategies,
    getHolderDidForStrategy,
    type SignerStrategyId,
} from './signerStrategies';

type WalletInvoke = {
    presentCredentials: (
        input: string | AuthorizationRequest,
        chosen: ChosenForPresentation[],
        options?: {
            holder?: string;
            envelopeFormat?: 'jwt_vp' | 'ldp_vp';
            signer?: ProofJwtSigner;
        }
    ) => Promise<{
        request: AuthorizationRequest;
        prepared?: PreparedPresentation;
        signed?: SignPresentationResult;
        signedIdToken?: SignIdTokenResult;
        dcqlBuilt?: BuiltDcqlPresentation[];
        dcqlSigned?: DcqlSignedPresentation[];
        dcqlVpToken?: Record<string, unknown>;
        submitted: SubmitPresentationResult;
    }>;
};

type ResilientWallet = BespokeLearnCard & { invoke: WalletInvoke };

interface ResilientPresentCredentialsArgs {
    wallet: ResilientWallet;
    request: AuthorizationRequest;
    chosen: ChosenForPresentation[];
    callbacks?: RunWithRecoveryCallbacks;
}

/**
 * Drop-in replacement for `wallet.invoke.presentCredentials` that
 * wraps the plugin call in the resilience orchestrator. Matches the
 * holder DID to whichever signer strategy is active (critical — if
 * the VP's outer `holder` field doesn't match the proof JWT's `iss`,
 * spec-strict verifiers reject the submission).
 */
export const resilientPresentCredentials = async ({
    wallet,
    request,
    chosen,
    callbacks,
}: ResilientPresentCredentialsArgs): Promise<{
    request: AuthorizationRequest;
    prepared?: PreparedPresentation;
    signed?: SignPresentationResult;
    signedIdToken?: SignIdTokenResult;
    dcqlBuilt?: BuiltDcqlPresentation[];
    dcqlSigned?: DcqlSignedPresentation[];
    dcqlVpToken?: Record<string, unknown>;
    submitted: SubmitPresentationResult;
}> => {
    const availableSigners = getApplicableSignerStrategies(wallet);
    let currentSignerId: SignerStrategyId = availableSigners[0];

    return runWithRecovery(
        async ({ strategy }) => {
            if (strategy.axis === 'signer') {
                currentSignerId = strategy.id as SignerStrategyId;
            }

            const signer = await buildSignerForStrategy(wallet, currentSignerId);
            const holder = getHolderDidForStrategy(wallet, currentSignerId);

            return wallet.invoke.presentCredentials(request, chosen, {
                signer,
                holder,
            });
        },
        { availableSigners },
        callbacks
    );
};
