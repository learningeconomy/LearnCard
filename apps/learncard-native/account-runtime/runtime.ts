import {
    prepareShare,
    shareWallet,
    classifySharePublication,
    buildAppShareLinkUrl,
    resolveExpiryIso,
    type PreparedShare,
} from '../../../apps/learn-card-app/src/components/share-links/shareLinkFlow';
import type { ShareLinkOperationKeyInput } from '@learncard/types';
import { buildNativeTemplate, type NativeCredentialDraft } from './credential-draft';
import { initLearnCard } from '@learncard/init';
import { createSSSStrategy } from '../../../packages/sss-key-manager/src/sss-strategy';
import type { RecoveryInput } from '../../../packages/sss-key-manager/src/types';
import { AuthCoordinator } from '../../../packages/learn-card-base/src/auth-coordinator/AuthCoordinator';
import type { UnifiedAuthState } from '../../../packages/learn-card-base/src/auth-coordinator/types';
import type { NativeGlobal, NativeUser, NativeMessage } from './types';
import { LCN_DID_WEB_REGEX } from '../../../packages/learn-card-base/src/constants/regexes';
import { createConsumerCommands, consumerErrorCode } from './consumer-apps';
import { createFamilyCommands, familyErrorCode, type FamilyPinService } from './families';
import { getClient as getAccountAPI } from '@learncard/lca-api-client';
import { isFamilyCreation, sendPersonalCreation } from './personal-creations';

const bridge = (globalThis as unknown as NativeGlobal).webkit.messageHandlers;
const native = (input: NativeMessage): Promise<string | null> =>
    bridge.accountNative.postMessage(input);
const origins = new Set([
    'https://staging.network.learncard.com',
    'https://staging.cloud.learncard.com',
    'https://staging.api.learncard.app',
]);
globalThis.fetch = async (input, options) => {
    const request = new Request(input, options);
    const url = new URL(request.url);
    if (!origins.has(url.origin) || url.username || url.password)
        throw new Error('Service refused');
    const reply = await bridge.accountTransport.postMessage({
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: await request.text(),
    });
    const result = new Response(reply.body, {
        status: reply.status,
        headers: { 'Content-Type': reply.contentType },
    });
    Object.defineProperty(result, 'url', { value: request.url });
    return result;
};
// No key material or raw credential payloads in console output.
for (const level of ['debug', 'log', 'info', 'warn', 'error'] as const) console[level] = () => {};

let coordinator: AuthCoordinator;
let strategy: ReturnType<typeof createSSSStrategy>;
let wallet: import('./consumer-apps').ConsumerWallet | undefined;
let wasm: Uint8Array;
let user: NativeUser;
let myProfileName: string;
const issuerNames = new Map<string, Promise<string>>();
const original = new Map<string, Record<string, unknown>>();
let collection: Record<string, unknown>[] = [];
let cursor: string | undefined;
let hasMore = false;
const activity: { id: string; title: string; detail: string; symbol: string; date: string }[] = [];
const storage = {
    storeDeviceShare: async (value: string, id?: string) => {
        await native({ op: 'set', id, field: 'share', value });
    },
    getDeviceShare: (id?: string) => native({ op: 'get', id, field: 'share' }),
    hasDeviceShare: async (id?: string) =>
        (await native({ op: 'get', id, field: 'share' })) !== null,
    clearAllShares: async (id?: string) => {
        await native({ op: 'remove', id, field: 'share' });
        await native({ op: 'remove', id, field: 'version' });
    },
    deleteDeviceShare: async (id?: string) => {
        await native({ op: 'remove', id, field: 'share' });
    },
    storeShareVersion: async (version: number, id?: string) => {
        await native({ op: 'set', id, field: 'version', value: String(version) });
    },
    getShareVersion: async (id?: string) => {
        const value = await native({ op: 'get', id, field: 'version' });
        return value === null ? null : Number(value);
    },
};
const signer = async (privateKey: string, challenge?: string) => {
    const signing = await initLearnCard({ seed: privateKey, didkit: wasm });
    return (await signing.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge })) as string;
};

const stateDTO = async (state: UnifiedAuthState) => {
    if (state.status === 'error')
        return { phase: 'recovery', methods: ['phrase', 'backup', 'email'], error: 'recovery' };
    if (state.status !== 'ready')
        return {
            phase: state.status,
            methods:
                state.status === 'needs_recovery'
                    ? state.recoveryMethods.map(method => method.type)
                    : [],
        };
    if (!state.did || !state.authSessionValid) throw new Error('Account identity missing');
    const signing = await initLearnCard({ seed: state.privateKey, didkit: wasm });
    if (signing.id.did() !== state.did) throw new Error('Identity mismatch');
    const token = await native({ op: 'idToken' });
    if (!token) throw new Error('Sign in first');
    const status = await strategy.fetchServerKeyStatus(token, 'firebase');
    if (!status.primaryDid || status.primaryDid !== state.did)
        throw new Error('Account identity mismatch');
    wallet = await initLearnCard({
        seed: state.privateKey,
        didkit: wasm,
        network: 'https://staging.network.learncard.com/trpc',
        trustedBoostRegistry: '',
        cloud: { url: 'https://staging.cloud.learncard.com/trpc' },
        allowRemoteContexts: false,
    });
    const profile = await wallet.invoke.getProfile();
    if (!profile) {
        wallet = undefined;
        return { phase: 'missing_profile', methods: [] };
    }
    myProfileName = profile.displayName || user.email;
    return {
        phase: 'ready',
        methods: [],
        profileName: myProfileName,
        profileImage: image(profile.image),
        profileBio: profile.bio,
        profileId: profile.profileId,
        signingDid: state.did,
        profileDid: wallet.id.did(),
    };
};

const string = (value: unknown): string => (typeof value === 'string' ? value : '');
const object = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
const image = (value: unknown): string | undefined => {
    const address = string(value) || string(object(value).id) || string(object(value).url);
    try {
        const url = new URL(address);
        return url.protocol === 'https:' ? address : undefined;
    } catch {
        return undefined;
    }
};
const kindFor = (category: unknown): string => {
    const value = string(category).toLowerCase();
    return value.includes('id') || value.includes('member') || value.includes('family')
        ? 'Memberships'
        : value.includes('learn') || value.includes('study')
          ? 'Learning'
          : 'Achievements';
};
const issuerLabel = async (value: unknown): Promise<string> => {
    const issuer = object(value);
    const name = string(issuer.name) || string(issuer.displayName);
    if (name) return name;
    const did = string(value) || string(issuer.id);
    if (!did) return 'Issuer unavailable';
    if (did === wallet?.id.did()) return myProfileName;
    const extracted = did.startsWith('did:web:') ? did.match(LCN_DID_WEB_REGEX)?.[2] : undefined;
    let profileId: string | undefined;
    try {
        profileId =
            extracted && !extracted.includes(':') ? decodeURIComponent(extracted) : undefined;
    } catch {
        /* Invalid display metadata. */
    }
    if (profileId && wallet && did.startsWith('did:web:staging.network.learncard.com:users:')) {
        if (!issuerNames.has(did)) {
            const current = wallet;
            const fallback = `@${profileId}`;
            issuerNames.set(
                did,
                current.invoke
                    .getProfile(profileId)
                    .then(profile => profile?.displayName || fallback)
                    .catch(() => fallback)
            );
        }
        return issuerNames.get(did)!;
    }
    return profileId ? `@${profileId}` : 'Issuer details inside';
};
const display = async (record: Record<string, unknown>, verify = true) => {
    if (!wallet) throw new Error('Sign in first');
    const uri = string(record.uri);
    let raw: Record<string, unknown> = {};
    let proofChecked = false;
    try {
        raw = object(await wallet.read.get(uri));
        if (Object.keys(raw).length) {
            if (verify) {
                const result = await wallet.invoke.verifyCredential(raw as never, {
                    checks: ['proof'],
                });
                proofChecked = result.errors.length === 0;
            }
            original.set(uri, raw);
        }
    } catch {
        /* Keep collection metadata visible when content or remote verification is unavailable. */
    }
    const subjects = Array.isArray(raw.credentialSubject)
        ? raw.credentialSubject
        : [raw.credentialSubject];
    const subject = object(subjects[0]);
    const achievement = object(subject.achievement);
    const issuer = object(raw.issuer);
    return {
        id: uri,
        title: string(record.title) || string(raw.name) || string(achievement.name) || 'Credential',
        issuer: await issuerLabel(raw.issuer),
        summary: string(achievement.description) || string(raw.description),
        kind: kindFor(record.category),
        category: string(record.category) || undefined,
        date: string(raw.issuanceDate) || string(raw.validFrom) || '1970-01-01T00:00:00Z',
        createdByMe: raw.issuer === wallet.id.did() || issuer.id === wallet.id.did(),
        isSample: false,
        artworkURL: image(achievement.image) || image(raw.image),
        issuerLogoURL: image(issuer.image),
        signedPayload: Object.keys(raw).length ? JSON.stringify(raw) : undefined,
        verificationSummary: proofChecked
            ? 'Signature checked. Issuer trust and status not checked.'
            : 'Verification unavailable.',
    };
};

const snapshot = async (more = false) => {
    if (!wallet) throw new Error('Sign in first');
    if (!more) {
        collection = [];
        cursor = undefined;
        original.clear();
    }
    const page = await wallet.index.LearnCloud.getPage({}, { limit: 30, cursor });
    for (const record of page.records) {
        if (string(record.id).startsWith('__verifiable_data_')) continue;
        if (!string(record.uri) || collection.some(item => item.id === record.uri)) continue;
        collection.push(await display(record));
    }
    cursor = page.cursor;
    hasMore = page.hasMore;
    const incoming = await wallet.invoke.getIncomingCredentials();
    const offers = [];
    for (const record of incoming.slice(0, 30))
        offers.push(await display({ ...record, title: '' }));
    return { credentials: collection, offers, activity, hasMore };
};

// Session retry journal: retain a created template and completed delivery when later indexing/refresh fails.
// A dropped network reply remains ambiguous; durable cross-launch delivery recovery is a later gate.
const drafts = new Map<
    string,
    {
        fingerprint: string;
        uri: string;
        credentialUri?: string;
        indexed: boolean;
        complete: boolean;
    }
>();
const creationURIs = new Set<string>();
const shares = new Map<
    string,
    { fingerprint: string; prepared: PreparedShare; operation?: ShareLinkOperationKeyInput }
>();

const commands = {
    ...createConsumerCommands(() => wallet),
    ...createFamilyCommands(
        () => wallet,
        async current => {
            const client = await getAccountAPI(
                'https://staging.api.learncard.app/trpc',
                async challenge => {
                    const proof = await current.invoke.getDidAuthVp({
                        proofFormat: 'jwt',
                        challenge,
                    });
                    if (typeof proof !== 'string') throw new Error('Account proof unavailable');
                    return proof;
                }
            );
            return {
                hasPin: () => client.pins.hasPin.query({}),
                createPin: pin => client.pins.createPin.mutate({ pin }),
                verifyPin: pin => client.pins.verifyPin.query({ pin }),
            } satisfies FamilyPinService;
        }
    ),
    initialize: async (input: { wasmBase64: string; user: NativeUser }) => {
        user = input.user;
        wasm = Uint8Array.from(atob(input.wasmBase64), char => char.charCodeAt(0));
        strategy = createSSSStrategy({
            serverUrl: 'https://staging.api.learncard.app/api',
            tenantId: 'learncard',
            storage,
            enableEmailBackupShare: false,
        });
        coordinator = new AuthCoordinator({
            keyDerivation: strategy,
            authProvider: {
                getIdToken: async forceRefresh => {
                    const token = await native({ op: 'idToken', forceRefresh });
                    if (!token) throw new Error('Sign in first');
                    return token;
                },
                getCurrentUser: async () => ({
                    ...user,
                    providerType: 'firebase',
                    createdAt: user.createdAt ? new Date(Number(user.createdAt)) : undefined,
                }),
                getProviderType: () => 'firebase',
                signOut: async () => {
                    await native({ op: 'signOut' });
                },
            },
            didFromPrivateKey: async seed => (await initLearnCard({ seed, didkit: wasm })).id.did(),
            signDidAuthVp: signer,
            serverStatusTimeoutMs: 30_000,
            legacyAccountThresholdMs: 5 * 60 * 1000,
            clearPendingEscrowRecovery: async () => {},
        });
        return stateDTO(await coordinator.initialize());
    },
    recover: async (input: RecoveryInput) => {
        if (!['phrase', 'backup', 'email'].includes(input.method))
            throw new Error('Recovery method not supported');
        return stateDTO(await coordinator.recover(input));
    },
    snapshot: async () => snapshot(),
    more: async () => snapshot(true),
    claim: async (input: { uri: string }) => {
        if (!wallet) throw new Error('Sign in first');
        const raw = original.get(input.uri);
        if (
            !raw ||
            (await wallet.invoke.verifyCredential(raw as never, { checks: ['proof'] })).errors
                .length
        )
            throw new Error('Credential signature unavailable');
        await wallet.invoke.acceptCredential(input.uri, { skipNotification: true });
        const existing = await wallet.index.LearnCloud.get({ uri: input.uri });
        if (!existing.length)
            await wallet.index.LearnCloud.add({
                id: input.uri,
                uri: input.uri,
                title:
                    string(object(object(raw.credentialSubject).achievement).name) ||
                    string(raw.name) ||
                    'Credential',
                category: 'Achievement',
            });
        activity.unshift({
            id: crypto.randomUUID(),
            title: 'Added to your collection',
            detail: 'Credential received',
            symbol: 'tray.and.arrow.down',
            date: new Date().toISOString(),
        });
        return snapshot();
    },
    create: async (input: { title: string; summary: string; kind: string }) => {
        if (
            !wallet ||
            !input.title.trim() ||
            !input.summary.trim() ||
            input.title.length > 100 ||
            input.summary.length > 1000
        )
            throw new Error('Invalid draft');
        const unsigned = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
            ],
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: input.title,
            issuer: wallet.id.did(),
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: wallet.id.did(),
                type: ['AchievementSubject'],
                achievement: {
                    id: `urn:uuid:${crypto.randomUUID()}`,
                    type: ['Achievement'],
                    name: input.title,
                    description: input.summary,
                    criteria: { narrative: input.summary },
                },
            },
        };
        const credential = await wallet.invoke.issueCredential(unsigned as never);
        const uri = await wallet.store.LearnCloud.uploadEncrypted(credential);
        const category =
            input.kind === 'Learning'
                ? 'Learning History'
                : input.kind === 'Memberships'
                  ? 'ID'
                  : 'Achievement';
        await wallet.index.LearnCloud.add({ id: uri, uri, title: input.title, category });
        activity.unshift({
            id: crypto.randomUUID(),
            title: 'Created a credential',
            detail: input.title,
            symbol: 'sparkles',
            date: new Date().toISOString(),
        });
        return snapshot();
    },
    createDraft: async (input: NativeCredentialDraft) => {
        if (!wallet) throw new Error('Sign in first');
        const template = buildNativeTemplate(input, wallet.id.did(), myProfileName);
        const recipient = input.recipient?.trim() || wallet.id.did();
        if (input.recipient && !(await wallet.invoke.getProfile(recipient)))
            throw new Error('Recipient unavailable');
        const fingerprint = JSON.stringify(input);
        let saved = drafts.get(input.requestID);
        if (saved && saved.fingerprint !== fingerprint)
            throw new Error('Draft changed during delivery');
        const category =
            input.kind === 'Learning'
                ? 'Learning History'
                : input.kind === 'Memberships'
                  ? 'ID'
                  : 'Achievement';
        if (!saved) {
            const uri = await wallet.invoke.createBoost(template as never, {
                name: input.title.trim(),
                category,
            });
            saved = { fingerprint, uri, indexed: false, complete: false };
            drafts.set(input.requestID, saved);
        }
        if (!saved.credentialUri) {
            const response = await wallet.invoke.send({
                type: 'boost',
                recipient,
                templateUri: saved.uri,
            });
            saved.credentialUri = response.credentialUri;
            if (!saved.credentialUri) throw new Error('Delivery incomplete');
        }
        if (!input.recipient && !saved.indexed) {
            await wallet.invoke.acceptCredential(saved.credentialUri, { skipNotification: true });
            const credential = await wallet.read.get(saved.credentialUri);
            const indexedURI = await wallet.store.LearnCloud.uploadEncrypted(credential);
            await wallet.index.LearnCloud.add({
                id: saved.credentialUri,
                uri: indexedURI,
                title: input.title,
                category,
            });
            saved.indexed = true;
        }
        if (!saved.complete) {
            activity.unshift({
                id: crypto.randomUUID(),
                title: input.recipient ? 'Credential created and sent' : 'Created a credential',
                detail: input.title,
                symbol: input.recipient ? 'paperplane' : 'sparkles',
                date: new Date().toISOString(),
            });
            saved.complete = true;
        }
        return snapshot();
    },
    creations: async (input: { cursor?: string }) => {
        if (!wallet) throw new Error('Sign in first');
        const page = await wallet.invoke.getPaginatedBoosts({
            limit: 20,
            cursor: input.cursor,
            query: { status: { $in: ['LIVE', 'PROVISIONAL'] } },
        });
        const credentials = [];
        for (const record of page.records) {
            if (isFamilyCreation(record)) continue;
            creationURIs.add(record.uri);
            const item = await display(
                {
                    uri: record.uri,
                    title: record.name,
                    category: record.category,
                },
                false
            );
            credentials.push({
                ...item,
                date: record.created || '1970-01-01T00:00:00Z',
                createdByMe: true,
            });
        }
        return { credentials, hasMore: page.hasMore, cursor: page.cursor };
    },
    searchRecipients: async (input: { query: string }) => {
        if (!wallet || input.query.trim().length < 2 || input.query.length > 100) return [];
        const profiles = await wallet.invoke.searchProfiles(input.query.trim(), { limit: 15 });
        return profiles.map(profile => ({
            id: profile.profileId,
            name: profile.displayName || profile.profileId,
        }));
    },
    recipient: async (input: { profileId: string }) => {
        const profile = await wallet?.invoke.getProfile(input.profileId);
        if (!profile) throw new Error('Recipient not found');
        return { id: profile.profileId, name: profile.displayName || profile.profileId };
    },
    send: async (input: { uri: string; recipient: string }) => {
        if (!wallet || !creationURIs.has(input.uri) || !input.recipient.trim())
            throw new Error('Creation unavailable');
        const current = wallet;
        await sendPersonalCreation(current, input, () => wallet === current);
        activity.unshift({
            id: crypto.randomUUID(),
            title: 'Credential sent',
            detail: input.recipient,
            symbol: 'paperplane',
            date: new Date().toISOString(),
        });
        return snapshot();
    },
    share: async (input: {
        uris: string[];
        title: string;
        requestID: string;
        passcode?: string;
    }) => {
        if (
            !wallet ||
            !input.requestID ||
            input.requestID.length > 100 ||
            !input.title.trim() ||
            input.title.length > 120 ||
            !Array.isArray(input.uris) ||
            !input.uris.length ||
            input.uris.length > 50 ||
            new Set(input.uris).size !== input.uris.length ||
            input.uris.some(uri => !collection.some(record => record.id === uri)) ||
            (input.passcode && (input.passcode.length < 8 || input.passcode.length > 64))
        )
            throw new Error('Invalid sharing selection');
        const fingerprint = JSON.stringify(input);
        let saved = shares.get(input.requestID);
        if (saved && saved.fingerprint !== fingerprint)
            throw new Error('Sharing selection changed');
        const adapter = shareWallet(wallet);
        if (!saved) {
            saved = {
                fingerprint,
                prepared: await prepareShare(
                    adapter,
                    input.uris,
                    input.title,
                    '',
                    resolveExpiryIso('30'),
                    { passcode: input.passcode }
                ),
            };
            shares.set(input.requestID, saved);
        }
        let reply = saved.operation
            ? await wallet.invoke.retryShareLinkOperation(saved.operation)
            : await wallet.invoke.createShareLink(saved.prepared.input);
        let outcome = classifySharePublication(reply);
        if (outcome.status === 'abandoned') {
            saved.operation = undefined;
            reply = await wallet.invoke.createShareLink(saved.prepared.input);
            outcome = classifySharePublication(reply);
        }
        if (outcome.status === 'pending') {
            saved.operation = outcome.operation;
            return { pending: true };
        }
        if (outcome.status !== 'active') throw new Error('Sharing link unavailable');
        return {
            pending: false,
            url: buildAppShareLinkUrl(
                'https://staging.learncard.app',
                saved.prepared.input.id,
                saved.prepared.key
            ),
        };
    },
    updateProfile: async (input: { name: string; bio: string }) => {
        if (!wallet || !input.name.trim() || input.name.length > 100 || input.bio.length > 500)
            throw new Error('Invalid profile');
        await wallet.invoke.updateProfile({
            displayName: input.name.trim(),
            bio: input.bio.trim(),
        });
        const profile = await wallet.invoke.getProfile();
        if (!profile) throw new Error('Profile unavailable');
        myProfileName = profile.displayName || user.email;
        return {
            phase: 'ready',
            methods: [],
            profileName: myProfileName,
            profileId: profile.profileId,
            profileImage: image(profile.image),
            profileBio: profile.bio,
            profileDid: wallet.id.did(),
        };
    },
    signOut: async () => {
        await coordinator.logout();
        wallet = undefined;
        original.clear();
        creationURIs.clear();
        drafts.clear();
        shares.clear();
        return { phase: 'idle', methods: [] };
    },
    forget: async () => {
        await coordinator.forgetDevice();
        await coordinator.logout();
        wallet = undefined;
        original.clear();
        creationURIs.clear();
        drafts.clear();
        shares.clear();
        return { phase: 'idle', methods: [] };
    },
};

Object.defineProperty(globalThis, 'LearnCardAccount', {
    value: {
        call: async (method: string, input: unknown) => {
            if (!Object.hasOwn(commands, method)) throw new Error('Command refused');
            try {
                return JSON.stringify({
                    ok: true,
                    value: await (
                        commands[method as keyof typeof commands] as (
                            value: never
                        ) => Promise<unknown>
                    )(input as never),
                });
            } catch (error) {
                return JSON.stringify({
                    ok: false,
                    error: method.startsWith('families')
                        ? familyErrorCode(error)
                        : method.startsWith('apps') || method.startsWith('privacy')
                          ? consumerErrorCode(error)
                          : method === 'initialize'
                            ? 'connection'
                            : method === 'recover'
                              ? 'recovery'
                              : 'unavailable',
                });
            }
        },
    },
});
