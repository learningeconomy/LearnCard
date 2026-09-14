export interface LearnCardWalletMethodArgument {
    name: string;
    type: string;
    required: boolean;
    description: string;
}

export interface LearnCardWalletMethodExample {
    description: string;
    args: unknown[];
}

export interface LearnCardWalletMethodMetadata {
    path: string;
    signature: string;
    parameters: string[];
    description: string;
    arguments: LearnCardWalletMethodArgument[];
    returns: string;
    preconditions?: string[];
    notes?: string[];
    examples?: LearnCardWalletMethodExample[];
    failureHints?: string[];
    metadataSource: string;
}

type MethodMetadataInput = Omit<LearnCardWalletMethodMetadata, 'path' | 'metadataSource'>;

const NETWORK_TYPES_SOURCE = 'packages/plugins/learn-card-network/src/types.ts';
const LEARNCARD_TYPES_SOURCE = 'packages/learn-card-types/src/lcn.ts';
const APP_HELPER_SOURCE = 'apps/learn-card-app/src/components/boost/boostHelpers.ts';

const methodMetadata: Record<string, MethodMetadataInput> = {
    'id.did': {
        signature: 'did()',
        parameters: [],
        description:
            'Get the configured service wallet public DID, not the authenticated learner DID.',
        arguments: [],
        returns: 'string',
    },
    'invoke.getProfile': {
        signature: 'getProfile(profileId)',
        parameters: ['profileId'],
        description:
            'Get a public LearnCard Network profile by explicit profile ID using anonymous authority, never the service wallet.',
        arguments: [
            {
                name: 'profileId',
                type: 'string',
                required: true,
                description:
                    'Explicit profile ID such as "taylor". Self-profile lookup is unavailable.',
            },
        ],
        returns: 'Promise<LCNVisibleProfile | undefined>',
        examples: [{ description: 'Specific profile', args: ['taylor'] }],
        failureHints: [
            'Supply an explicit profile ID. Options and connection-tier fields are unavailable.',
        ],
    },
    'invoke.searchProfiles': {
        signature: 'searchProfiles(profileId?, options?)',
        parameters: ['profileId?', 'options?'],
        description:
            'Search public LearnCard Network profiles anonymously, without service relationships or connection-tier data.',
        arguments: [
            {
                name: 'profileId',
                type: 'string | undefined',
                required: false,
                description: 'Search text, usually a profile ID or name fragment.',
            },
            {
                name: 'options',
                type: '{ limit?: number; includeServiceProfiles?: boolean }',
                required: false,
                description:
                    'Public search controls only. limit must be an integer from 1 to 99. Self and connection-status options are not permitted.',
            },
        ],
        returns: 'Promise<Array<LCNVisibleProfile>>',
        examples: [{ description: 'Find Taylor', args: ['Taylor'] }],
    },
    'invoke.createBoost': {
        signature: 'createBoost(credential, metadata?)',
        parameters: ['credential', 'metadata?'],
        description:
            'Create a LearnCard Network Boost template from a VC or unsigned VC and optional Boost metadata.',
        arguments: [
            {
                name: 'credential',
                type: 'VC | UnsignedVC',
                required: true,
                description:
                    'The credential template. For VC v2 use @context https://www.w3.org/ns/credentials/v2 and validFrom.',
            },
            {
                name: 'metadata',
                type: 'Partial<Omit<Boost, "uri">> & { skills?: Array<{ frameworkId: string; id: string; proficiencyLevel?: number }> }',
                required: false,
                description:
                    'Boost metadata such as name, type, category, status, defaultPermissions, autoConnectRecipients, meta, or skills.',
            },
        ],
        returns: 'Promise<string> boostUri',
        notes: [
            'Boosts are templates. The stored template subject is commonly a placeholder such as did:example:123.',
            'Use sendBoost to create a recipient-specific credential instance; sendBoost rewrites credentialSubject.id to the recipient DID.',
            'Use status PROVISIONAL for tests that still need edits and LIVE for finalized templates.',
        ],
        examples: [
            {
                description: 'Create a test achievement Boost template',
                args: [
                    {
                        '@context': ['https://www.w3.org/ns/credentials/v2'],
                        type: ['VerifiableCredential', 'AchievementCredential'],
                        issuer: 'did:web:localhost%3A4000:users:issuer',
                        validFrom: '2026-05-22T00:00:00.000Z',
                        name: 'Synthetic Test Achievement',
                        credentialSubject: {
                            id: 'did:example:123',
                            achievement: { name: 'Synthetic Test Achievement' },
                        },
                    },
                    { name: 'Synthetic Test Achievement', category: 'Achievement', status: 'LIVE' },
                ],
            },
        ],
    },
    'invoke.createChildBoost': {
        signature: 'createChildBoost(parentUri, credential, metadata?)',
        parameters: ['parentUri', 'credential', 'metadata?'],
        description:
            'Create a child Boost template under an existing parent Boost from a VC or unsigned VC.',
        arguments: [
            {
                name: 'parentUri',
                type: 'string',
                required: true,
                description: 'Parent Boost URI.',
            },
            {
                name: 'credential',
                type: 'VC | UnsignedVC',
                required: true,
                description: 'Child credential template.',
            },
            {
                name: 'metadata',
                type: 'Partial<Omit<Boost, "uri">> & { skills?: Array<{ frameworkId: string; id: string; proficiencyLevel?: number }> }',
                required: false,
                description: 'Child Boost metadata.',
            },
        ],
        returns: 'Promise<string> childBoostUri',
        notes: [
            'As with createBoost, the stored child Boost is a template and may use a placeholder credentialSubject.id.',
        ],
    },
    'invoke.getBoost': {
        signature: 'getBoost(uri)',
        parameters: ['uri'],
        description: 'Read Boost metadata and template credential by Boost URI.',
        arguments: [
            {
                name: 'uri',
                type: 'string',
                required: true,
                description: 'Boost URI returned by createBoost.',
            },
        ],
        returns: 'Promise<Boost & { boost: UnsignedVC }>',
        examples: [
            {
                description: 'Read a Boost',
                args: ['lc:network:localhost%3A4000/trpc:boost:example'],
            },
        ],
    },
    'invoke.sendBoost': {
        signature: 'sendBoost(profileId, boostUri, options?)',
        parameters: ['profileId', 'boostUri', 'options?'],
        description:
            'Issue a recipient-specific credential from a Boost template and send it to a LearnCard Network profile.',
        arguments: [
            {
                name: 'profileId',
                type: 'string',
                required: true,
                description: 'Recipient profile ID, for example "taylor". This is first.',
            },
            {
                name: 'boostUri',
                type: 'string',
                required: true,
                description: 'Boost URI returned by createBoost. This is second.',
            },
            {
                name: 'options',
                type: 'boolean | { encrypt?: boolean; skipNotification?: boolean; templateData?: Record<string, unknown> }',
                required: false,
                description:
                    'Defaults to encrypted send. templateData is rendered into Mustache placeholders in the Boost template.',
            },
        ],
        returns: 'Promise<string> sentCredentialUri',
        preconditions: [
            'The recipient profile must exist and have a DID.',
            'For direct profile sends, the current profile may need an accepted connection with the recipient.',
        ],
        notes: [
            'Argument order is profileId first, boostUri second. Reversing them produces URI or generic send errors.',
            'sendBoost rewrites credentialSubject.id to the recipient profile DID before issuing.',
            'For email or phone recipients, use the unified send route if available or sendCredentialViaInbox for direct inbox issuance.',
        ],
        examples: [
            {
                description: 'Send an encrypted Boost to Taylor without notification',
                args: [
                    'taylor',
                    'lc:network:localhost%3A4000/trpc:boost:example',
                    { encrypt: true, skipNotification: true },
                ],
            },
        ],
        failureHints: [
            'Usage: sendBoost(profileId, boostUri, options?). Put the profile ID first and the Boost URI second.',
            'If a direct send requires a connection, ask the operator to arrange it outside this tool or use an authorized inbox delivery.',
        ],
    },
    'invoke.send': {
        signature: 'send(input)',
        parameters: ['input'],
        description:
            'Unified send API. For type "boost", sends a Boost template, inline template, or signed credential to a profile ID, DID, email, or phone recipient.',
        arguments: [
            {
                name: 'input',
                type: '{ type: "boost"; recipient: string; templateUri?: string; template?: object; signedCredential?: VC; options?: { webhookUrl?: string; suppressDelivery?: boolean; branding?: object; guardianEmail?: string }; templateData?: Record<string, unknown>; integrationId?: string }',
                required: true,
                description:
                    'Send request. For Boost sends, provide exactly one of templateUri, template, or signedCredential.',
            },
        ],
        returns: 'Promise<SendResponse>',
        notes: [
            'This method can route email/phone recipients through Universal Inbox.',
            'For direct LearnCard profile sends when you already have a Boost URI, sendBoost(profileId, boostUri, options?) is simpler.',
        ],
        examples: [
            {
                description: 'Send a Boost through the unified send API',
                args: [
                    {
                        type: 'boost',
                        recipient: 'student@example.edu',
                        templateUri: 'lc:network:localhost%3A4000/trpc:boost:example',
                        options: { suppressDelivery: true },
                    },
                ],
            },
        ],
        failureHints: [
            'For type "boost", provide templateUri, template, or signedCredential.',
            'recipient is a single string. The SDK auto-detects profile ID, DID, email, or phone.',
        ],
    },
    'invoke.issueCredential': {
        signature: 'issueCredential(credential)',
        parameters: ['credential'],
        description:
            'Sign an unsigned credential with the current wallet DID using the local LearnCard credential plugin.',
        arguments: [
            {
                name: 'credential',
                type: 'UnsignedVC',
                required: true,
                description: 'Unsigned VC payload to sign.',
            },
        ],
        returns: 'Promise<VC>',
        notes: [
            'This is local wallet signing, not Universal Inbox signing authority registration.',
            'If this fails for a VC v2 payload, check the credential context, proof format support, and required VC fields.',
        ],
    },
    'invoke.sendCredentialViaInbox': {
        signature: 'sendCredentialViaInbox(issueInboxCredential)',
        parameters: ['issueInboxCredential'],
        description:
            'Issue a credential through Universal Inbox to an email or phone contact method.',
        arguments: [
            {
                name: 'issueInboxCredential',
                type: '{ recipient: { type: "email" | "phone"; value: string }; credential?: VC | VP | UnsignedVC; templateUri?: string; configuration?: { signingAuthority?: { endpoint: string; name: string }; webhookUrl?: string; expiresInDays?: number; templateData?: Record<string, unknown>; delivery?: { suppress?: boolean } } }',
                required: true,
                description:
                    'Inbox issuance request. Either credential or templateUri is required.',
            },
        ],
        returns:
            'Promise<{ issuanceId: string; status: string; recipient: { type: "email" | "phone"; value: string }; claimUrl?: string; recipientDid?: string }>',
        preconditions: [
            'recipient.type must be "email" or "phone"; profileId and DID recipients are not valid for this method.',
            'Unsigned credentials require either a primary registered signing authority or configuration.signingAuthority.',
        ],
        notes: [
            'For direct LearnCard Network profile delivery, prefer sendBoost(profileId, boostUri, options?).',
            'Use an operator-configured signing authority or an already signed credential. Account/signing-authority management is not available through this tool.',
        ],
        examples: [
            {
                description:
                    'Send unsigned credential with explicit signing authority and suppressed delivery',
                args: [
                    {
                        recipient: { type: 'email', value: 'student@example.edu' },
                        credential: {
                            '@context': ['https://www.w3.org/ns/credentials/v2'],
                            type: ['VerifiableCredential'],
                            issuer: 'did:web:issuer.example',
                            validFrom: '2026-05-22T00:00:00.000Z',
                            credentialSubject: { id: 'did:example:recipient' },
                        },
                        configuration: {
                            signingAuthority: {
                                endpoint: 'https://issuer.example/issue',
                                name: 'default-issuer',
                            },
                            delivery: { suppress: true },
                        },
                    },
                ],
            },
        ],
        failureHints: [
            'Use recipient { type: "email", value: "name@example.com" } or { type: "phone", value: "+15555555555" } only.',
            'Put signing authority under configuration.signingAuthority, not at the top level.',
            'If no signing authority is configured, sign the credential first or ask the operator to configure one outside this tool.',
        ],
    },
};

const metadataSources: Record<string, string> = {
    'id.did': 'packages/plugins/didkey/src/index.ts',
    'invoke.getProfile':
        'services/learn-card-network/ai-agent/src/tools/learnCardWallet/index.ts; services/learn-card-network/brain-service/src/routes/profiles.ts',
    'invoke.searchProfiles':
        'services/learn-card-network/ai-agent/src/tools/learnCardWallet/index.ts; services/learn-card-network/brain-service/src/routes/profiles.ts',
    'invoke.createBoost': NETWORK_TYPES_SOURCE,
    'invoke.createChildBoost': NETWORK_TYPES_SOURCE,
    'invoke.getBoost': NETWORK_TYPES_SOURCE,
    'invoke.sendBoost': `${NETWORK_TYPES_SOURCE}; ${APP_HELPER_SOURCE}`,
    'invoke.send': `${NETWORK_TYPES_SOURCE}; ${LEARNCARD_TYPES_SOURCE}`,
    'invoke.sendCredentialViaInbox': `${NETWORK_TYPES_SOURCE}; ${LEARNCARD_TYPES_SOURCE}`,
    'invoke.issueCredential': 'LearnCard credential plugin',
};

export const getLearnCardWalletMethodMetadata = (
    walletPath: string
): LearnCardWalletMethodMetadata | undefined => {
    const metadata = methodMetadata[walletPath];
    if (!Object.hasOwn(methodMetadata, walletPath)) return undefined;

    return {
        path: walletPath,
        metadataSource: metadataSources[walletPath] ?? NETWORK_TYPES_SOURCE,
        ...metadata,
    };
};
