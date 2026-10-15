import { inAppMessageValidator } from '@learncard/types';
import {
    messageMatches,
    type InAppMessageRuntimeContext,
} from 'learn-card-base/in-app-messages/predicates';
import {
    buildCredentialDryRunContext,
    PILOT_ISSUER,
    explainDryRunFailure,
} from './inAppMessageDryRun';

const base: InAppMessageRuntimeContext = {
    platform: 'web',
    role: 'learner',
    versions: {},
    now: Date.now(),
    credentials: null,
    credentialsComplete: false,
    recentEvents: [],
};
const message = inAppMessageValidator.parse({
    id: 'pilot',
    title: 'Pilot',
    targeting: { credential: { issuers: [PILOT_ISSUER], vcTypes: ['ClrCredential'] } },
    trigger: {
        event: 'credential.claimed',
        where: { issuers: [PILOT_ISSUER], vcTypes: ['ClrCredential'] },
    },
});

it('distinguishes pilot CLRs from other issuers, other types, and absent facts', () => {
    expect(messageMatches(message, buildCredentialDryRunContext(base, 'Pilot CLR', true))).toBe(
        true
    );
    for (const preset of [
        'None',
        'Other-issuer CLR',
        'Pilot non-CLR',
        'Incomplete facts',
    ] as const) {
        const context = buildCredentialDryRunContext(base, preset, true);
        expect(messageMatches(message, context)).toBe(false);
        expect(explainDryRunFailure(message, context)).toBeTruthy();
    }
    expect(messageMatches(message, buildCredentialDryRunContext(base, 'Pilot CLR', false))).toBe(
        false
    );
});

it('keeps negation false for incomplete facts and true for a complete empty index', () => {
    const negative = { ...message, trigger: undefined, targeting: { not: message.targeting! } };
    expect(
        messageMatches(negative, buildCredentialDryRunContext(base, 'Incomplete facts', false))
    ).toBe(false);
    expect(messageMatches(negative, buildCredentialDryRunContext(base, 'None', false))).toBe(true);
});
