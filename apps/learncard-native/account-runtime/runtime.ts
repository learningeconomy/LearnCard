import { initLearnCard } from '@learncard/init';
import { createSSSStrategy } from '../../../packages/sss-key-manager/src/sss-strategy';
import type { RecoveryInput } from '../../../packages/sss-key-manager/src/types';
import { AuthCoordinator } from '../../../packages/learn-card-base/src/auth-coordinator/AuthCoordinator';
import type { UnifiedAuthState } from '../../../packages/learn-card-base/src/auth-coordinator/types';
import type { NativeGlobal, NativeUser, NativeMessage } from './types';
import { LCN_DID_WEB_REGEX } from '../../../packages/learn-card-base/src/constants/regexes';

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
let wallet: Awaited<ReturnType<typeof initLearnCard>> | undefined;
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
    return value.includes('id') || value.includes('member')
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
const display = async (record: Record<string, unknown>) => {
    if (!wallet) throw new Error('Sign in first');
    const uri = string(record.uri);
    let raw: Record<string, unknown> = {};
    let proofChecked = false;
    try {
        raw = object(await wallet.read.get(uri));
        if (Object.keys(raw).length) {
            const result = await wallet.invoke.verifyCredential(raw as never, {
                checks: ['proof'],
            });
            proofChecked = result.errors.length === 0;
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

const commands = {
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
    recipient: async (input: { profileId: string }) => {
        const profile = await wallet?.invoke.getProfile(input.profileId);
        if (!profile) throw new Error('Recipient not found');
        return { id: profile.profileId, name: profile.displayName || profile.profileId };
    },
    send: async (input: { uri: string; recipient: string }) => {
        const credential = original.get(input.uri);
        if (
            !wallet ||
            !credential ||
            (credential.issuer !== wallet.id.did() &&
                object(credential.issuer).id !== wallet.id.did())
        )
            throw new Error('Sender authority missing');
        await wallet.invoke.sendCredential(input.recipient, credential as never);
        activity.unshift({
            id: crypto.randomUUID(),
            title: 'Credential sent',
            detail: input.recipient,
            symbol: 'paperplane',
            date: new Date().toISOString(),
        });
        return snapshot();
    },
    signOut: async () => {
        await coordinator.logout();
        wallet = undefined;
        original.clear();
        return { phase: 'idle', methods: [] };
    },
    forget: async () => {
        await coordinator.forgetDevice();
        await coordinator.logout();
        wallet = undefined;
        original.clear();
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
            } catch {
                return JSON.stringify({
                    ok: false,
                    error:
                        method === 'initialize'
                            ? 'connection'
                            : method === 'recover'
                              ? 'recovery'
                              : 'unavailable',
                });
            }
        },
    },
});
