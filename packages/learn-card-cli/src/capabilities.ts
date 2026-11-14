/**
 * Curated map of what LearnCard can do and how to reach each capability: a first-class
 * CLI command, an SDK method usable with `learncard call`, a REST route usable with
 * `learncard api`, the docs page, and a tested snippet when one exists.
 *
 * `capabilities.test.ts` checks every `cli` entry against the command tree, every `call`
 * entry against the plugin type definitions, every `snippet` against docs/snippets/ and
 * every `docs` URL against the GitBook URL model (scripts/check-docs-links.mjs --urls).
 */
import type { Command } from 'commander';

import packageJson from '../package.json';
import { CliError } from './errors';
import { out } from './out';
import { closestMatches } from './manifest';
import type { RunCommand } from './doctor';

export interface Capability {
    id: string;
    title: string;
    summary: string;
    /** Exact command paths (as in `commands --json`). */
    cli: string[];
    /** `learnCard.invoke.*` method names usable with `learncard call <method>`. */
    call: string[];
    /** LearnCard Network REST API (base `<network origin>/api`), or null when not exposed. */
    api: { tag?: string; paths?: string[] } | null;
    /** docs.learncard.com page. */
    docs: string;
    /** Runnable, CI-tested example under docs/snippets/. */
    snippet?: string;
    notes?: string;
}

const DOCS = 'https://docs.learncard.com';

export const CAPABILITIES: readonly Capability[] = [
    {
        id: 'identity',
        title: 'Issuer identity and profile',
        summary:
            'Create the folder identity (seed + did:key) and its public network profile; look up or update profiles.',
        cli: ['init', 'whoami'],
        call: [
            'getProfile',
            'updateProfile',
            'searchProfiles',
            'createProfile',
            'createServiceProfile',
        ],
        api: { tag: 'Profiles', paths: ['/profile/create', '/profile/create-service'] },
        docs: `${DOCS}/understand/decentralized-identifiers-dids/network-profiles`,
        snippet: 'docs/snippets/methods/profiles.mjs',
        notes: 'Only init, send, org apply (and setup commands) create an identity; profile IDs are globally unique per network.',
    },
    {
        id: 'send-credential',
        title: 'Send a credential',
        summary:
            'Issue and deliver a credential to an email, phone number, profile ID or DID in one call (Universal Inbox for addresses without an account).',
        cli: ['send', 'status'],
        call: ['send'],
        api: { tag: 'Send', paths: ['/send'] },
        docs: `${DOCS}/build/send-credentials`,
        snippet: 'docs/snippets/quickstart/send.mjs',
        notes: 'Use --network staging and --suppress-delivery while testing; a real address gets a real email.',
    },
    {
        id: 'templates',
        title: 'Credential templates (boosts)',
        summary:
            'Create, read and update reusable credential templates and list who received them.',
        cli: ['send'],
        call: [
            'createBoost',
            'getBoost',
            'updateBoost',
            'getPaginatedBoosts',
            'getPaginatedBoostRecipients',
            'deleteBoost',
        ],
        api: { tag: 'Boosts', paths: ['/boost/create'] },
        docs: `${DOCS}/understand/verifiable-credentials-vcs/boost-credentials`,
        snippet: 'docs/snippets/methods/templates.mjs',
        notes: 'The CLI auto-creates one template; reuse any template with send --template-uri.',
    },
    {
        id: 'custom-credentials',
        title: 'Build and sign a custom credential locally',
        summary:
            'Build an unsigned credential from a template type, sign it with the folder key, and verify it, without the network.',
        cli: [],
        call: ['newCredential', 'issueCredential', 'verifyCredential'],
        api: null,
        docs: `${DOCS}/understand/verifiable-credentials-vcs/building-verifiable-credentials`,
        snippet: 'docs/snippets/methods/issue-verify.mjs',
    },
    {
        id: 'verify',
        title: 'Verify credentials and presentations',
        summary: 'Check proofs, expiry and status of a credential or presentation.',
        cli: ['verify', 'clr validate'],
        call: ['verifyCredential', 'verifyPresentation'],
        api: null,
        docs: `${DOCS}/build/verify-credentials`,
        snippet: 'docs/snippets/verify/issue-and-verify.mjs',
        notes: 'verify accepts JSON-LD credentials and presentations (file or stdin).',
    },
    {
        id: 'signing-authorities',
        title: 'Signing authorities',
        summary:
            'Let LearnCard (or your own VC-API service) sign credentials for your profile, so templates can be sent without your key.',
        cli: ['setup-signing', 'doctor', 'org apply'],
        call: [
            'registerSigningAuthority',
            'getRegisteredSigningAuthorities',
            'getPrimaryRegisteredSigningAuthority',
            'setPrimaryRegisteredSigningAuthority',
        ],
        api: {
            tag: 'Profiles',
            paths: [
                '/profile/signing-authority/register',
                '/profile/signing-authority/get/all',
                '/profile/signing-authority/set-primary',
            ],
        },
        docs: `${DOCS}/build/send-credentials/create-signing-authority`,
        notes: 'Creating a hosted signing authority needs the LCA API plugin; use setup-signing rather than call.',
    },
    {
        id: 'api-tokens',
        title: 'API tokens and auth grants',
        summary: 'Create scoped bearer tokens for backends and the REST API; list and revoke them.',
        cli: ['token'],
        call: [
            'addAuthGrant',
            'getAuthGrants',
            'getAuthGrant',
            'getAPITokenForAuthGrant',
            'revokeAuthGrant',
        ],
        api: {
            tag: 'Auth Grants',
            paths: ['/auth-grant/create', '/profile/auth-grants', '/auth-grant/{id}/revoke'],
        },
        docs: `${DOCS}/build/go-to-production/generate-api-tokens`,
        snippet: 'docs/snippets/methods/auth-grants.mjs',
        notes: 'Tokens are secrets: token saves to .env (API_TOKEN) and omits it from --json unless --show-secret.',
    },
    {
        id: 'org-and-managed-profiles',
        title: 'Issuer organizations and managed profiles',
        summary:
            'Declare an issuer, signing authority, managed sub-issuers (did:web), service accounts and webhooks in one YAML spec; send as a managed profile; promote staging to production.',
        cli: ['org apply', 'promote', 'whoami', 'send'],
        call: ['createManagedServiceProfile', 'getManagedServiceProfiles', 'getAvailableProfiles'],
        api: {
            tag: 'Profiles',
            paths: ['/profile/create-managed-service', '/profile/managed-services'],
        },
        docs: `${DOCS}/build/send-credentials/bootstrap-an-issuer-org`,
        snippet: 'docs/snippets/cli/org/minimal.network.yaml',
        notes: 'Use org apply --dry-run first; send --as <profileId> issues as a managed profile.',
    },
    {
        id: 'universal-inbox',
        title: 'Universal Inbox',
        summary:
            'Deliver credentials to people without a LearnCard account by email or phone, and track pending claims.',
        cli: ['send', 'inbox list'],
        call: ['sendCredentialViaInbox', 'getMySentInboxCredentials', 'getInboxCredential'],
        api: { tag: 'Universal Inbox', paths: ['/inbox/issue', '/inbox/issued'] },
        docs: `${DOCS}/reference/learncard-network/universal-inbox-api`,
    },
    {
        id: 'claim-links',
        title: 'Claim links',
        summary:
            'Generate claim-link parameters (boostUri + challenge) for a template; your app turns them into a claim link. Treat the challenge as a secret.',
        cli: [],
        call: ['generateClaimLink', 'claimBoostWithLink', 'getClaimBoostWithLinkStatus'],
        api: {
            tag: 'Boosts',
            paths: ['/boost/generate-claim-link', '/boost/claim', '/boost/claim/status'],
        },
        docs: `${DOCS}/reference/learncard-core/construction#signing-authorities-and-claim-links`,
        notes: 'The template needs a registered signing authority (setup-signing).',
    },
    {
        id: 'embed-claim-button',
        title: 'Claim button on your site',
        summary:
            'Create an integration with a publishable key and allowed origins, and drop a Claim button into a web page.',
        cli: ['embed', 'open'],
        call: ['addIntegration', 'getIntegration', 'updateIntegration'],
        api: { tag: 'Integrations', paths: ['/integration/create'] },
        docs: `${DOCS}/build/embed-a-claim-button`,
        snippet: 'docs/snippets/cli/claim-button.html',
        notes: 'embed also registers a hosted signing authority and makes it primary.',
    },
    {
        id: 'consentflow',
        title: 'ConsentFlow contracts',
        summary:
            "Connect a user's LearnCard to your platform: define what data you request, read consented data, write credentials back.",
        cli: ['consent-contract'],
        call: [
            'createContract',
            'getContracts',
            'getContract',
            'getConsentFlowData',
            'getConsentFlowDataForDid',
            'writeCredentialToContract',
            'verifyConsent',
        ],
        api: {
            tag: 'Contracts',
            paths: [
                '/consent-flow-contract',
                '/consent-flow-contract/data-for-did',
                '/consent-flow-contract/write',
            ],
        },
        docs: `${DOCS}/build/create-a-consentflow`,
        snippet: 'docs/snippets/consentflow/create-contract.mjs',
    },
    {
        id: 'contract-requests',
        title: 'Contract requests',
        summary:
            'Ask a specific profile to consent to a contract, poll the request status, and sync credentials into it.',
        cli: [],
        call: [
            'sendContractRequest',
            'getContractSentRequests',
            'getRequestStatusForProfile',
            'syncCredentialsToContract',
        ],
        api: {
            tag: 'Contracts',
            paths: ['/consent-flow-contracts/request', '/consent-flow-contracts/sent-requests'],
        },
        docs: `${DOCS}/reference/learncard-network/contract-requests-and-events`,
        snippet: 'docs/snippets/contract-requests/request-and-poll.mjs',
    },
    {
        id: 'revocation',
        title: 'Revocation and suspension',
        summary:
            'Revoke (permanent) or suspend (reversible) a credential you issued from a template.',
        cli: ['revoke'],
        call: ['revokeBoostRecipient', 'suspendBoostRecipient', 'unsuspendBoostRecipient'],
        api: {
            tag: 'Boosts',
            paths: [
                '/boost/recipients/revoke',
                '/boost/recipients/suspend',
                '/boost/recipients/unsuspend',
            ],
        },
        docs: `${DOCS}/build/send-credentials/revoke-or-update-a-credential`,
        notes: 'Revocation cannot be undone: confirm with the user first.',
    },
    {
        id: 'credential-refresh',
        title: 'Managed credential refresh',
        summary:
            'Issue a refreshable credential, publish new versions, and let holders refresh their copy.',
        cli: ['refresh history', 'demo refresh'],
        call: [
            'sendRefreshableCredential',
            'publishCredentialRefresh',
            'getCredentialRefreshHistory',
            'refreshCredential',
        ],
        api: {
            tag: 'Credential Refresh',
            paths: [
                '/credential-refresh/send',
                '/credential-refresh/publish',
                '/credential-refresh/history',
            ],
        },
        docs: `${DOCS}/build/send-credentials/issue-and-refresh-a-managed-credential`,
        snippet: 'docs/snippets/refresh/publish-update.mjs',
    },
    {
        id: 'activity',
        title: 'Credential activity',
        summary:
            'What happened to each credential you sent: created, delivered, claimed, expired, failed.',
        cli: ['status'],
        call: ['getMyActivities', 'getActivity', 'getActivityChain', 'getActivityStats'],
        api: {
            tag: 'Activity',
            paths: ['/activity/credentials', '/activity/credentials/{activityId}'],
        },
        docs: `${DOCS}/reference/learncard-network/credential-activity`,
        snippet: 'docs/snippets/cli/status.mjs',
    },
    {
        id: 'webhooks',
        title: 'Webhooks',
        summary:
            'Receive signed ISSUANCE_DELIVERED / ISSUANCE_CLAIMED (and other) events at your URL.',
        cli: ['webhook', 'send'],
        call: ['updateProfile'],
        api: null,
        docs: `${DOCS}/build/send-credentials/listen-to-webhooks`,
        snippet: 'docs/snippets/cli/webhook.mjs',
        notes: 'Per send: send --webhook-url. Profile-wide: updateProfile({ notificationsWebhook }).',
    },
    {
        id: 'skills-frameworks',
        title: 'Skills and frameworks',
        summary:
            'Create or import skill frameworks (e.g. OpenSALT), browse skill trees, and align templates to skills.',
        cli: [],
        call: [
            'createManagedSkillFramework',
            'listMySkillFrameworks',
            'getSkillFrameworkById',
            'getFrameworkSkillTree',
            'searchFrameworkSkills',
            'attachFrameworkToBoost',
            'alignBoostSkills',
        ],
        api: { tag: 'Skills' },
        docs: `${DOCS}/reference/learncard-network/skills-and-opensalt`,
    },
    {
        id: 'connections',
        title: 'Connections',
        summary:
            'Connect profiles to each other, accept requests, list connections, create invites.',
        cli: [],
        call: [
            'connectWith',
            'acceptConnectionRequest',
            'getPaginatedConnections',
            'generateInvite',
            'disconnectWith',
        ],
        api: { tag: 'Profiles', paths: ['/profile/{profileId}/connect', '/profile/connections'] },
        docs: `${DOCS}/reference/learncard-core/construction`,
        snippet: 'docs/snippets/methods/connections.mjs',
    },
    {
        id: 'peer-credentials',
        title: 'Send and accept credentials directly',
        summary:
            'Send a signed credential to a profile and accept incoming ones (holder side), without templates.',
        cli: [],
        call: [
            'sendCredential',
            'acceptCredential',
            'getIncomingCredentials',
            'getReceivedCredentials',
            'getSentCredentials',
        ],
        api: {
            tag: 'Credentials',
            paths: ['/credential/send/{profileId}', '/credential/accept', '/credentials/received'],
        },
        docs: `${DOCS}/reference/learncard-core/construction`,
        snippet: 'docs/snippets/methods/send-accept.mjs',
    },
    {
        id: 'presentations',
        title: 'Presentations',
        summary: 'Wrap credentials in a signed presentation and send or receive presentations.',
        cli: ['verify'],
        call: [
            'newPresentation',
            'issuePresentation',
            'verifyPresentation',
            'sendPresentation',
            'getReceivedPresentations',
        ],
        api: { tag: 'Presentations', paths: ['/presentation/send/{profileId}'] },
        docs: `${DOCS}/build/verify-credentials`,
    },
    {
        id: 'learncloud-storage',
        title: 'LearnCloud storage',
        summary: 'Encrypted cloud storage and indexing for credentials and custom documents.',
        cli: [],
        call: ['learnCloudCreate', 'learnCloudRead', 'learnCloudUpdate', 'learnCloudDelete'],
        api: null,
        docs: `${DOCS}/reference/learncloud-storage-api`,
        snippet: 'docs/snippets/methods/store-read-index.mjs',
        notes: 'Storing credentials uses learnCard.store / index / read (not invoke) in code; LearnCloud has its own REST API.',
    },
    {
        id: 'did-metadata',
        title: 'DID metadata',
        summary: 'Attach service endpoints and verification methods to your did:web document.',
        cli: [],
        call: [
            'addDidMetadata',
            'getDidMetadata',
            'getMyDidMetadata',
            'updateDidMetadata',
            'deleteDidMetadata',
        ],
        api: { tag: 'DID Metadata', paths: ['/did-metadata/create', '/profile/did-metadata'] },
        docs: `${DOCS}/reference/learncard-core/construction`,
        snippet: 'docs/snippets/methods/did-metadata.mjs',
    },
    {
        id: 'share-links',
        title: 'Share links',
        summary:
            'Create, list and revoke links that share credentials with people outside LearnCard.',
        cli: [],
        call: ['createShareLink', 'listShareLinks', 'getShareLink', 'revokeShareLink'],
        api: { tag: 'ShareLinks' },
        docs: `${DOCS}/reference/learncard-network`,
        notes: 'No dedicated docs page yet; see the OpenAPI spec for the request shapes.',
    },
    {
        id: 'app-store',
        title: 'Apps inside LearnCard (App Store and Partner Connect)',
        summary:
            'Publish an app that runs inside the LearnCard app: create a listing, submit it for review, issue from your app.',
        cli: ['embed', 'open'],
        call: [
            'getIntegrations',
            'createAppStoreListing',
            'getAppStoreListing',
            'submitAppStoreListingForReview',
        ],
        api: { tag: 'App Store' },
        docs: `${DOCS}/build/publish-your-app`,
        snippet: 'docs/snippets/publish-your-app/build.ts',
    },
    {
        id: 'clr-transcripts',
        title: 'CLR 2.0 transcripts',
        summary:
            'Validate a CLR 2.0 transcript against schema and issuer-profile rules, optionally test-sign it.',
        cli: ['clr validate'],
        call: [],
        api: null,
        docs: `${DOCS}/reference/learncard-cli`,
    },
    {
        id: 'xapi',
        title: 'Learning activity (xAPI)',
        summary: 'Record xAPI statements about learning activity to LearnCloud.',
        cli: [],
        call: [],
        api: null,
        docs: `${DOCS}/build/sending-xapi-statements`,
        notes: 'xAPI goes to the LearnCloud xAPI endpoint, not the Network API.',
    },
    {
        id: 'agent-tooling',
        title: 'Coding-agent discovery and escape hatches',
        summary:
            'Discover every command and capability as JSON, install the LearnCard skill for Claude Code / Cursor / other agents, and reach any SDK method (`call`) or REST route (`api`) that has no dedicated command.',
        cli: ['commands', 'capabilities', 'skill install', 'call', 'api'],
        call: [],
        api: null,
        docs: `${DOCS}/start-here/for-ai-agents/use-learncard-with-coding-agents`,
        notes: '`call` and `api` refuse anything that can change data unless --write is passed; use --dry-run first.',
    },
];

/** Shape of `capabilities --json`. */
export interface CapabilitiesResult {
    version: string;
    capabilities: Capability[];
}

export interface CapabilitiesOptions {
    json?: boolean;
}

const pad = (value: string, width: number): string => value.padEnd(width);

/**
 * `learncard capabilities [id]`: print the capability map (or one entry). In `--json`
 * mode the runner prints `{ok:true, command:'capabilities', version, capabilities}`.
 */
export const runCapabilities = async (
    id: string | undefined,
    _options: CapabilitiesOptions = {}
): Promise<void> => {
    let selected: Capability[] = [...CAPABILITIES];
    if (id) {
        const match = CAPABILITIES.find(capability => capability.id === id.trim().toLowerCase());
        if (!match) {
            const suggestions = closestMatches(
                id,
                CAPABILITIES.map(capability => capability.id)
            );
            throw new CliError(`Unknown capability "${id}".`, {
                code: 'UNKNOWN_CAPABILITY',
                hint: suggestions.length
                    ? `Did you mean: ${suggestions.join(', ')}? Run \`npx @learncard/cli capabilities\` for the full list.`
                    : 'Run `npx @learncard/cli capabilities` for the full list.',
            });
        }
        selected = [match];
    }

    out.set({ version: packageJson.version, capabilities: selected });
    // The listing is for humans; in --json mode stdout already carries everything.
    if (out.json) return;

    if (id) {
        const [capability] = selected as [Capability];
        out.log(`${capability.title} (${capability.id})`);
        out.log(capability.summary);
        out.log(`CLI:   ${capability.cli.length ? capability.cli.join(', ') : '—'}`);
        out.log(`call:  ${capability.call.length ? capability.call.join(', ') : '—'}`);
        const api = capability.api;
        out.log(
            `API:   ${api ? [api.tag && `tag "${api.tag}"`, ...(api.paths ?? [])].filter(Boolean).join(', ') : '—'}`
        );
        out.log(`Docs:  ${capability.docs}`);
        if (capability.snippet) out.log(`Code:  ${capability.snippet}`);
        if (capability.notes) out.log(`Note:  ${capability.notes}`);
        return;
    }

    const idWidth = Math.max(...selected.map(capability => capability.id.length));
    for (const capability of selected) {
        const cli = capability.cli.length
            ? capability.cli.join(', ')
            : capability.call.length
              ? 'call'
              : capability.api
                ? 'api'
                : 'SDK, see docs';
        out.log(`${pad(capability.id, idWidth)}  ${capability.title}  [${cli}]`);
    }
    out.log('');
    out.log('Details: npx @learncard/cli capabilities <id>');
    out.log('Machine-readable: npx @learncard/cli capabilities --json');
};

/** Register `capabilities [id]` on a commander program. */
export const registerCapabilitiesCommand = (program: Command, run: RunCommand): void => {
    program
        .command('capabilities [id]')
        .description(
            'What LearnCard can do and how to reach each capability: CLI command, SDK method for `call`, REST route for `api`, docs.'
        )
        .option('--json', 'print a single JSON result on stdout')
        .option('-y, --yes', 'accepted for consistency; this command never prompts')
        .option('--network <url>', 'accepted for consistency; this command does not use it')
        .action((id: string | undefined, options: CapabilitiesOptions) =>
            run('capabilities', options, async () => {
                await runCapabilities(id, options);
            })
        );
};
