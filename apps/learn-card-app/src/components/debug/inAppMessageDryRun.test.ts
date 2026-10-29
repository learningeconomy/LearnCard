import { inAppMessageValidator } from '@learncard/types';
import {
    messageMatches,
    type InAppMessageRuntimeContext,
} from 'learn-card-base/in-app-messages/predicates';
import {
    CREDENTIAL_LIBRARY_CLR_CONDITION,
    CREDENTIAL_LIBRARY_CLR_ISSUER,
    buildCredentialDryRunContext,
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
const libraryFixtureMessage = inAppMessageValidator.parse({
    id: 'credential-library-clr',
    title: 'Credential Library CLR',
    targeting: { credential: CREDENTIAL_LIBRARY_CLR_CONDITION },
    trigger: {
        event: 'credential.claimed',
        where: CREDENTIAL_LIBRARY_CLR_CONDITION,
    },
});

it('uses the credential-library clr/minimal fixture for portable CLR targeting', () => {
    expect(
        messageMatches(
            libraryFixtureMessage,
            buildCredentialDryRunContext(base, 'Library CLR (clr/minimal)', true)
        )
    ).toBe(true);
    expect(
        messageMatches(
            libraryFixtureMessage,
            buildCredentialDryRunContext(base, 'Other-issuer library CLR', true)
        )
    ).toBe(true);
    for (const preset of ['None', 'Library fixture non-CLR', 'Incomplete facts'] as const) {
        const context = buildCredentialDryRunContext(base, preset, true);
        expect(messageMatches(libraryFixtureMessage, context)).toBe(false);
        expect(explainDryRunFailure(libraryFixtureMessage, context)).toBeTruthy();
    }
    expect(
        messageMatches(
            libraryFixtureMessage,
            buildCredentialDryRunContext(base, 'Library CLR (clr/minimal)', false)
        )
    ).toBe(false);
});

it('still supports issuer-specific dry runs when the signing DID matters', () => {
    const issuerSpecific = inAppMessageValidator.parse({
        ...libraryFixtureMessage,
        trigger: undefined,
        targeting: {
            credential: {
                issuers: [CREDENTIAL_LIBRARY_CLR_ISSUER],
                ...CREDENTIAL_LIBRARY_CLR_CONDITION,
            },
        },
    });

    expect(
        messageMatches(
            issuerSpecific,
            buildCredentialDryRunContext(base, 'Library CLR (clr/minimal)', false)
        )
    ).toBe(true);
    expect(
        messageMatches(
            issuerSpecific,
            buildCredentialDryRunContext(base, 'Other-issuer library CLR', false)
        )
    ).toBe(false);
});

it('keeps negation false for incomplete facts and true for a complete empty index', () => {
    const negative = {
        ...libraryFixtureMessage,
        trigger: undefined,
        targeting: { not: libraryFixtureMessage.targeting! },
    };
    expect(
        messageMatches(negative, buildCredentialDryRunContext(base, 'Incomplete facts', false))
    ).toBe(false);
    expect(messageMatches(negative, buildCredentialDryRunContext(base, 'None', false))).toBe(true);
});
