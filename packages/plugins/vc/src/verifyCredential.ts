import { VC } from '@learncard/types';

import { ProofOptions } from '@learncard/didkit-plugin';
import { VCDependentLearnCard, VCImplicitLearnCard } from './types';
import { appendBitstringStatusChecks } from './bitstringStatus';

/**
 * DIDKit deserializes `statusListIndex` as a Rust `String` and hard-fails on a JSON
 * number ("invalid type: integer `436`, expected a string"). Some issuers — including
 * 1EdTech's conformance suite — emit it numerically. We cannot coerce it before
 * verifying, because that would change the JSON-LD canonicalization and invalidate the
 * proof, so we skip DIDKit's status check for these and rely on the BitstringStatusList
 * implementation in `@learncard/helpers` instead.
 */
const hasNumericStatusListIndex = (credential: VC): boolean => {
    const status = (credential as { credentialStatus?: unknown }).credentialStatus;
    if (!status) return false;

    return (Array.isArray(status) ? status : [status]).some(
        entry => typeof (entry as { statusListIndex?: unknown })?.statusListIndex === 'number'
    );
};

export const verifyCredential = (initLearnCard: VCDependentLearnCard) => {
    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC,
        _options: Partial<ProofOptions> = {}
    ) => {
        const options: Partial<ProofOptions> = { ..._options };

        const needsTsStatusCheck =
            Boolean(credential.credentialStatus) && hasNumericStatusListIndex(credential);

        if (!options.checks) {
            options.checks = ['proof'];
            if (credential.credentialStatus && !needsTsStatusCheck) {
                options.checks.push('credentialStatus');
            }
            if (credential.credentialSchema) options.checks.push('credentialSchema');
        }

        const result = await initLearnCard.invoke.verifyCredential(credential, options);

        if (needsTsStatusCheck) await appendBitstringStatusChecks(result, credential);

        return result;
    };
};
