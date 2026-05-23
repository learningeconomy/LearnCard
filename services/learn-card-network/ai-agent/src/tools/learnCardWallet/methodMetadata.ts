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
    'invoke.getProfile': {
        signature: 'getProfile(profileId?)',
        parameters: ['profileId?'],
        description:
            'Get the current profile when omitted, or a visible LearnCard Network profile by profileId.',
        arguments: [
            {
                name: 'profileId',
                type: 'string | undefined',
                required: false,
                description: 'Profile ID such as "taylor". Omit to get the configured wallet profile.',
            },
        ],
        returns: 'Promise<LCNVisibleProfile | undefined>',
        examples: [
            { description: 'Current profile', args: [] },
            { description: 'Specific profile', args: ['taylor'] },
        ],
        failureHints: ['Use a profile ID, not a DID, when looking up a network profile.'],
    },
    'invoke.searchProfiles': {
        signature: 'searchProfiles(profileId?, options?)',
        parameters: ['profileId?', 'options?'],
        description:
            'Search visible LearnCard Network profiles by profile ID/display text, with optional result controls.',
        arguments: [
            {
                name: 'profileId',
                type: 'string | undefined',
                required: false,
                description: 'Search text, usually a profile ID or name fragment.',
            },
            {
                name: 'options',
                type: '{ limit?: number; includeSelf?: boolean; includeConnectionStatus?: boolean; includeServiceProfiles?: boolean }',
                required: false,
                description: 'Optional search controls.',
            },
        ],
        returns: 'Promise<Array<LCNVisibleProfile & { connectionStatus?: string }>>',
        examples: [{ description: 'Find Taylor', args: ['Taylor'] }],
    },
    'invoke.connectWith': {
        signature: 'connectWith(profileId)',
        parameters: ['profileId'],
        description:
            'Request a network connection with another profile. This may create a pending connection rather than an accepted connection.',
        arguments: [
            {
                name: 'profileId',
                type: 'string',
                required: true,
                description: 'Recipient profile ID such as "taylor".',
            },
        ],
        returns: 'Promise<boolean>',
        preconditions: ['The target profile must allow connection requests.'],
        notes: [
            'After calling connectWith, check getConnections and getPendingConnections before assuming a write operation can use the connection.',
        ],
        examples: [{ description: 'Request connection', args: ['taylor'] }],
    },
    'invoke.acceptConnectionRequest': {
        signature: 'acceptConnectionRequest(profileId)',
        parameters: ['profileId'],
        description: 'Accept an incoming network connection request from a profile.',
        arguments: [
            {
                name: 'profileId',
                type: 'string',
                required: true,
                description: 'Profile ID that sent the incoming request.',
            },
        ],
        returns: 'Promise<boolean>',
        examples: [{ description: 'Accept usera request', args: ['usera'] }],
    },
    'invoke.getConnections': {
        signature: 'getConnections()',
        parameters: [],
        description: 'List accepted network connections for the current profile.',
        arguments: [],
        returns: 'Promise<LCNVisibleProfile[]>',
    },
    'invoke.getPendingConnections': {
        signature: 'getPendingConnections()',
        parameters: [],
        description:
            'List outgoing pending connection requests sent by the current profile. These are not accepted connections yet.',
        arguments: [],
        returns: 'Promise<LCNVisibleProfile[]>',
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
            'If connectWith only created a pending connection, ask the recipient to accept it before retrying direct sendBoost.',
            'Read getConnections and getPendingConnections to distinguish accepted vs pending connection state.',
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
    'invoke.countBoostRecipients': {
        signature: 'countBoostRecipients(boostUri)',
        parameters: ['boostUri'],
        description: 'Count recipients for a Boost URI.',
        arguments: [
            {
                name: 'boostUri',
                type: 'string',
                required: true,
                description: 'Boost URI to count recipients for.',
            },
        ],
        returns: 'Promise<number>',
    },
    'invoke.getBoostRecipients': {
        signature: 'getBoostRecipients(boostUri)',
        parameters: ['boostUri'],
        description: 'List recipients for a Boost URI.',
        arguments: [
            {
                name: 'boostUri',
                type: 'string',
                required: true,
                description: 'Boost URI to list recipients for.',
            },
        ],
        returns: 'Promise<BoostRecipientInfo[]>',
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
    'invoke.createSigningAuthority': {
        signature: 'createSigningAuthority(name, ownerDid?)',
        parameters: ['name', 'ownerDid?'],
        description:
            'Create a managed signing authority when the configured wallet includes the LCA/simple-signing plugin.',
        arguments: [
            {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Short signing authority relationship name.',
            },
            {
                name: 'ownerDid',
                type: 'string | undefined',
                required: false,
                description: 'Owner DID. Omit to use the current wallet DID when supported.',
            },
        ],
        returns: 'Promise<{ endpoint: string; name: string; did?: string } | false>',
        notes: ['This method is only present when the wallet has the signing service plugin loaded.'],
    },
    'invoke.registerSigningAuthority': {
        signature: 'registerSigningAuthority(endpoint, name, did)',
        parameters: ['endpoint', 'name', 'did'],
        description: 'Authorize a signing authority to issue credentials for the current profile.',
        arguments: [
            {
                name: 'endpoint',
                type: 'string',
                required: true,
                description: 'VC-API issuer endpoint returned by createSigningAuthority or external signer.',
            },
            {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Signing authority relationship name.',
            },
            {
                name: 'did',
                type: 'string',
                required: true,
                description: 'DID controlled by the signing authority.',
            },
        ],
        returns: 'Promise<boolean>',
        examples: [
            {
                description: 'Register a managed authority',
                args: ['https://issuer.example/issue', 'default-issuer', 'did:key:zExample'],
            },
        ],
    },
    'invoke.setPrimaryRegisteredSigningAuthority': {
        signature: 'setPrimaryRegisteredSigningAuthority(endpoint, name)',
        parameters: ['endpoint', 'name'],
        description:
            'Set a registered signing authority as the default for unsigned Universal Inbox credentials.',
        arguments: [
            {
                name: 'endpoint',
                type: 'string',
                required: true,
                description: 'Registered signing authority endpoint.',
            },
            {
                name: 'name',
                type: 'string',
                required: true,
                description: 'Registered signing authority relationship name.',
            },
        ],
        returns: 'Promise<boolean>',
    },
    'invoke.getPrimaryRegisteredSigningAuthority': {
        signature: 'getPrimaryRegisteredSigningAuthority()',
        parameters: [],
        description: 'Read the current profile primary registered signing authority, if any.',
        arguments: [],
        returns: 'Promise<LCNSigningAuthorityForUserType | undefined>',
    },
    'invoke.getRegisteredSigningAuthorities': {
        signature: 'getRegisteredSigningAuthorities()',
        parameters: [],
        description: 'List signing authorities registered for the current profile.',
        arguments: [],
        returns: 'Promise<LCNSigningAuthorityForUserType[]>',
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
                description: 'Inbox issuance request. Either credential or templateUri is required.',
            },
        ],
        returns: 'Promise<{ issuanceId: string; status: string; recipient: { type: "email" | "phone"; value: string }; claimUrl?: string; recipientDid?: string }>',
        preconditions: [
            'recipient.type must be "email" or "phone"; profileId and DID recipients are not valid for this method.',
            'Unsigned credentials require either a primary registered signing authority or configuration.signingAuthority.',
        ],
        notes: [
            'For direct LearnCard Network profile delivery, prefer sendBoost(profileId, boostUri, options?).',
            'If using an unsigned credential, create/register/set a signing authority first, or pass configuration.signingAuthority.',
        ],
        examples: [
            {
                description: 'Send unsigned credential with explicit signing authority and suppressed delivery',
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
            'If no signing authority is configured, either sign the credential first or create/register/set a primary signing authority.',
        ],
    },
    'read.get': {
        signature: 'get(uri, options?)',
        parameters: ['uri', 'options?'],
        description: 'Read credential or document content by URI.',
        arguments: [
            {
                name: 'uri',
                type: 'string',
                required: true,
                description: 'Credential, Boost, or storage URI.',
            },
            {
                name: 'options',
                type: '{ cache?: "cache-first" | "network-first" | "no-cache" }',
                required: false,
                description: 'Read cache behavior.',
            },
        ],
        returns: 'Promise<unknown>',
    },
    'store.LearnCloud.uploadEncrypted': {
        signature: 'uploadEncrypted(credential, options?)',
        parameters: ['credential', 'options?'],
        description: 'Encrypt and upload credential content to LearnCloud storage.',
        arguments: [
            {
                name: 'credential',
                type: 'VC | VP | object',
                required: true,
                description: 'Credential or presentation content to store encrypted.',
            },
            {
                name: 'options',
                type: 'unknown',
                required: false,
                description: 'Storage-specific options.',
            },
        ],
        returns: 'Promise<string> storageUri',
    },
};

const metadataSources: Record<string, string> = {
    'invoke.createBoost': NETWORK_TYPES_SOURCE,
    'invoke.createChildBoost': NETWORK_TYPES_SOURCE,
    'invoke.getBoost': NETWORK_TYPES_SOURCE,
    'invoke.sendBoost': `${NETWORK_TYPES_SOURCE}; ${APP_HELPER_SOURCE}`,
    'invoke.send': `${NETWORK_TYPES_SOURCE}; ${LEARNCARD_TYPES_SOURCE}`,
    'invoke.sendCredentialViaInbox': `${NETWORK_TYPES_SOURCE}; ${LEARNCARD_TYPES_SOURCE}`,
    'invoke.issueCredential': 'LearnCard credential plugin',
    'invoke.createSigningAuthority': 'packages/plugins/simple-signing-plugin/src/types.ts',
    'invoke.registerSigningAuthority': NETWORK_TYPES_SOURCE,
    'invoke.setPrimaryRegisteredSigningAuthority': NETWORK_TYPES_SOURCE,
    'invoke.getPrimaryRegisteredSigningAuthority': NETWORK_TYPES_SOURCE,
    'invoke.getRegisteredSigningAuthorities': NETWORK_TYPES_SOURCE,
};

export const getLearnCardWalletMethodMetadata = (
    walletPath: string
): LearnCardWalletMethodMetadata | undefined => {
    const metadata = methodMetadata[walletPath];
    if (!metadata) return undefined;

    return {
        path: walletPath,
        metadataSource: metadataSources[walletPath] ?? NETWORK_TYPES_SOURCE,
        ...metadata,
    };
};
