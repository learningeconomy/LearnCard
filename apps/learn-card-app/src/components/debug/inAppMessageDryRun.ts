import type { InAppMessage } from '@learncard/types';
import {
    explainMessage,
    type InAppMessageRuntimeContext,
    type PredicateTrace,
} from 'learn-card-base/in-app-messages/predicates';
import { summarizeCredential } from 'learn-card-base/in-app-messages/credentialFacts';

export const CREDENTIAL_PRESETS = [
    'This device',
    'None',
    'Pilot CLR',
    'Other-issuer CLR',
    'Pilot non-CLR',
    'Incomplete facts',
] as const;
export type CredentialPreset = (typeof CREDENTIAL_PRESETS)[number];
export const PILOT_ISSUER = 'did:example:pilot-issuer';

export const buildCredentialDryRunContext = (
    base: InAppMessageRuntimeContext,
    preset: CredentialPreset,
    simulateClaim: boolean,
    issuer = PILOT_ISSUER
): InAppMessageRuntimeContext => {
    const pilot = summarizeCredential(
        'debug:pilot-clr',
        {
            type: ['VerifiableCredential', 'ClrCredential'],
            issuer,
            validFrom: new Date(base.now).toISOString(),
        },
        'Learning History'
    );
    const credentials =
        preset === 'This device'
            ? base.credentials
            : preset === 'None' || preset === 'Incomplete facts'
              ? []
              : [
                    {
                        ...pilot,
                        issuer: preset === 'Other-issuer CLR' ? 'did:example:other-issuer' : issuer,
                        types:
                            preset === 'Pilot non-CLR'
                                ? ['VerifiableCredential', 'OpenBadgeCredential']
                                : pilot.types,
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
                      credential: credentials?.[0] ?? pilot,
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
