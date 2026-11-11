import { clrMinimal } from '@learncard/credential-library';
import type { InAppMessage } from '@learncard/types';
import {
    explainMessage,
    type InAppMessageRuntimeContext,
    type PredicateTrace,
} from 'learn-card-base/in-app-messages/predicates';
import {
    summarizeCredential,
    type CredentialSummary,
} from 'learn-card-base/in-app-messages/credentialFacts';

export const CREDENTIAL_PRESETS = [
    'This device',
    'None',
    'Library CLR (clr/minimal)',
    'Other-issuer library CLR',
    'Library fixture non-CLR',
    'Incomplete facts',
] as const;
export type CredentialPreset = (typeof CREDENTIAL_PRESETS)[number];
export const CREDENTIAL_LIBRARY_CLR_ISSUER = 'did:example:stateuniversity';
export const CREDENTIAL_LIBRARY_CLR_CONDITION = {
    vcTypes: ['ClrCredential'],
    achievementTypes: ['Course'],
};

export const summarizeCredentialLibraryClr = (
    uri: string,
    issuer: string,
    type: string,
    issuedAt: string
): CredentialSummary =>
    summarizeCredential(
        uri,
        {
            ...clrMinimal.credential,
            issuer,
            type: ['VerifiableCredential', type],
            validFrom: issuedAt,
        },
        'Learning History'
    );

export const buildCredentialDryRunContext = (
    base: InAppMessageRuntimeContext,
    preset: CredentialPreset,
    simulateClaim: boolean,
    issuer = CREDENTIAL_LIBRARY_CLR_ISSUER
): InAppMessageRuntimeContext => {
    const libraryClr = summarizeCredentialLibraryClr(
        `debug:credential-library:${clrMinimal.id}`,
        issuer,
        'ClrCredential',
        new Date(base.now).toISOString()
    );
    const credentials =
        preset === 'This device'
            ? base.credentials
            : preset === 'None' || preset === 'Incomplete facts'
              ? []
              : [
                    {
                        ...libraryClr,
                        issuer:
                            preset === 'Other-issuer library CLR'
                                ? 'did:example:other-issuer'
                                : issuer,
                        types:
                            preset === 'Library fixture non-CLR'
                                ? ['VerifiableCredential', 'OpenBadgeCredential']
                                : libraryClr.types,
                    },
                ];
    return {
        ...base,
        credentials,
        credentialsComplete:
            preset === 'This device' ? base.credentialsComplete : preset !== 'Incomplete facts',
        recentEvents: simulateClaim
            ? [
                  {
                      event: 'credential.claimed',
                      occurredAt: base.now,
                      credential: credentials?.[0] ?? libraryClr,
                  },
              ]
            : preset === 'This device'
              ? base.recentEvents
              : [],
    };
};

const failingLeaf = (trace: PredicateTrace): string | null => {
    if (trace.result) return null;
    for (const child of trace.children ?? []) {
        const failure = failingLeaf(child);
        if (failure) return failure;
    }
    return trace.label;
};

export const explainDryRunFailure = (
    message: InAppMessage,
    context: InAppMessageRuntimeContext
): string | null => {
    const explanation = explainMessage(message, context);
    if (!message.enabled) return 'Message is disabled';
    if (explanation.trace && !explanation.trace.result) return failingLeaf(explanation.trace);
    if (!explanation.triggerSatisfied) return `Waiting for ${message.trigger?.event}`;
    return null;
};
