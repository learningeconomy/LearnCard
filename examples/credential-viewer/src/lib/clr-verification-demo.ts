import { initLearnCard } from '@learncard/init';
import { clrMultiIssuerVerification } from '@learncard/credential-library';
import { BitstringStatusListEntryValidator } from '@learncard/types';
import {
    NETWORK_PRESETS,
    type NetworkEnvConfig,
    type NetworkEnvKey,
} from '../context/WalletContext';

export interface ClrDemoDelivery {
    name: string;
    uri: string;
    expected: string;
}

export interface ClrDemoProgress {
    message: string;
    delivery?: ClrDemoDelivery;
}

export interface ClrDemoResult {
    deliveries: ClrDemoDelivery[];
    supportingCredentials: string[];
}

// WalletContext intentionally erases the SDK's plugin-tuple type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Wallet = any;
interface Document extends Record<string, unknown> {
    id: string;
    issuer: string | ({ id: string } & Record<string, unknown>);
    credentialSubject: {
        id: string;
        achievement?: { id: string; name: string; [key: string]: unknown };
        verifiableCredential?: Document[];
        [key: string]: unknown;
    };
    proof?: unknown;
    credentialStatus?: unknown;
}

const isLoopback = (value: string): boolean => {
    try {
        const url = new URL(value);
        return (
            (url.protocol === 'http:' || url.protocol === 'https:') &&
            !url.username &&
            !url.password &&
            ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        );
    } catch {
        return false;
    }
};

export const getClrDemoEnvironmentError = (
    envKey: NetworkEnvKey,
    config: NetworkEnvConfig
): string | null => {
    if (envKey === 'production') return 'The CLR demo cannot run on Production.';
    if (envKey === 'custom') {
        return isLoopback(config.network) &&
            isLoopback(config.cloud) &&
            (!config.lcaApi || isLoopback(config.lcaApi))
            ? null
            : 'Custom CLR demo services must all use loopback addresses.';
    }
    const preset = NETWORK_PRESETS[envKey];
    return preset &&
        config.network === preset.network &&
        config.cloud === preset.cloud &&
        config.lcaApi === preset.lcaApi
        ? null
        : 'The selected environment does not match its safe preset.';
};

const seed = (): string =>
    Array.from(crypto.getRandomValues(new Uint8Array(32)), byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

const belongsToNetwork = (did: string, network: string): boolean => {
    try {
        const host = new URL(network).host.toLowerCase();
        const match = /^did:web:([^:]+):users:[^:]+$/i.exec(did);
        return !!match && decodeURIComponent(match[1]).toLowerCase() === host;
    } catch {
        return false;
    }
};

const statusEntries = (credential: Document, network: string): void => {
    const entries = BitstringStatusListEntryValidator.array().parse(
        Array.isArray(credential.credentialStatus)
            ? credential.credentialStatus
            : [credential.credentialStatus]
    );
    for (const purpose of ['revocation', 'suspension']) {
        const entry = entries.find(item => item.statusPurpose === purpose);
        if (
            !entry ||
            entry.type !== 'BitstringStatusListEntry' ||
            !/^\d+$/.test(String(entry.statusListIndex))
        ) {
            throw new Error(`The supporting credential is missing its hosted ${purpose} status.`);
        }
        let url: URL;
        try {
            url = new URL(entry.statusListCredential);
        } catch {
            throw new Error('The supporting credential has an invalid status list URL.');
        }
        if (
            url.origin !== new URL(network).origin ||
            !url.pathname.startsWith('/status-lists/') ||
            entry.id !== `${entry.statusListCredential}#${entry.statusListIndex}`
        ) {
            throw new Error(
                'The supporting credential status is not hosted by the selected network.'
            );
        }
    }
};

export const sendClrVerificationDemo = async ({
    wallet,
    envKey,
    envConfig,
    recipient,
    onProgress,
}: {
    wallet: Wallet;
    envKey: NetworkEnvKey;
    envConfig: NetworkEnvConfig;
    recipient: string;
    onProgress?: (progress: ClrDemoProgress) => void;
}): Promise<ClrDemoResult> => {
    const environmentError = getClrDemoEnvironmentError(envKey, envConfig);
    if (environmentError) throw new Error(environmentError);
    const profileId = recipient.trim();
    if (!profileId || profileId.startsWith('did:'))
        throw new Error('Enter a recipient profile ID on the selected network.');
    if (!wallet?.invoke?.getProfile)
        throw new Error('Connect a publisher with a network profile first.');

    // Profile DIDs encode the network authority. Check both before any persistent writes;
    // the selected environment can change independently of an already-connected wallet.
    const publisher = await wallet.invoke.getProfile();
    if (
        !publisher?.profileId ||
        !publisher.did ||
        !belongsToNetwork(publisher.did, envConfig.network) ||
        wallet.id.did() !== publisher.did
    ) {
        throw new Error(
            'The connected publisher does not belong to the selected network. Reconnect first.'
        );
    }
    const learner = await wallet.invoke.getProfile(profileId);
    if (
        !learner?.did ||
        learner.profileId !== profileId ||
        !belongsToNetwork(learner.did, envConfig.network)
    ) {
        throw new Error('The recipient profile was not found on the selected network.');
    }

    const run = crypto.randomUUID();
    const label = run.slice(0, 8);
    const report = (message: string, delivery?: ClrDemoDelivery) =>
        onProgress?.({ message, ...(delivery ? { delivery } : {}) });
    const result: ClrDemoResult = { deliveries: [], supportingCredentials: [] };
    report('Creating two fictional district issuers.');
    const districts: Wallet[] = [];
    for (const [index, name] of [
        'North Valley School District (Fictional)',
        'Pine Ridge School District (Fictional)',
    ].entries()) {
        const district = await initLearnCard({
            seed: seed(),
            network: envConfig.network,
            cloud: { url: envConfig.cloud },
            allowRemoteContexts: true,
        });
        await district.invoke.createProfile({
            profileId: `clr-${index + 1}-${run.replaceAll('-', '')}`,
            displayName: name,
            bio: '',
            shortBio: '',
        });
        const profile = await district.invoke.getProfile();
        if (
            !profile ||
            !('did' in profile) ||
            !profile.did ||
            !belongsToNetwork(profile.did, envConfig.network) ||
            district.id.did() !== profile.did
        ) {
            throw new Error('A district profile could not be bound to the selected network.');
        }
        districts.push(district);
    }

    const blueprint = structuredClone(clrMultiIssuerVerification.credential) as unknown as Document;
    const children = blueprint.credentialSubject.verifiableCredential as Document[];
    const makeChild = (source: Document, issuer: string): Document => {
        const child = structuredClone(source);
        child.id = `urn:uuid:${crypto.randomUUID()}`;
        if (typeof child.issuer === 'string') child.issuer = { id: issuer };
        else child.issuer.id = issuer;
        child.credentialSubject.id = learner.did;
        if (!child.credentialSubject.achievement)
            throw new Error('The course blueprint has no achievement.');
        child.credentialSubject.achievement.id = `${child.id}#achievement`;
        delete child.credentialStatus;
        return child;
    };
    const valid = await districts[0].invoke.issueCredential(
        makeChild(children[0], districts[0].id.did())
    );
    const second = await districts[1].invoke.issueCredential(
        makeChild(children[2], districts[1].id.did())
    );

    const supporting: Document[] = [];
    for (const purpose of ['revocation', 'suspension'] as const) {
        report(`Delivering a supporting course for ${purpose}.`);
        const draft = makeChild(children[1], districts[1].id.did());
        const boost = await districts[1].invoke.createBoost(draft, { category: 'Achievement' });
        const sent = await districts[1].invoke.sendBoost(profileId, boost, {
            encrypt: true,
            skipNotification: true,
            enableRefresh: true,
            statusPurposes: ['revocation', 'suspension'],
        });
        if (!sent || typeof sent === 'string' || !sent.credentialUri || !sent.refresh) {
            throw new Error('Supporting course delivery returned no managed receipt.');
        }
        const { credentialUri: uri, refresh } = sent;
        if (
            refresh.credentialId !== draft.id ||
            refresh.holderDid !== learner.did ||
            refresh.issuerDid !== districts[1].id.did()
        ) {
            throw new Error(
                'The supporting receipt does not match its issuer, learner, and credential.'
            );
        }
        result.supportingCredentials.push(uri);
        report(`Supporting course for ${purpose} delivered.`);
        // Managed bodies are holder-encrypted. Re-sign this issuer's same claims using
        // the exact receipt identity/status bindings, without reading the holder's copy.
        const credential = (await districts[1].invoke.issueCredential({
            ...draft,
            credentialStatus: refresh.credentialStatus,
        })) as Document;
        const issuer =
            typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
        if (
            !credential?.proof ||
            credential.id !== draft.id ||
            credential.credentialSubject?.id !== learner.did ||
            issuer !== districts[1].id.did()
        ) {
            throw new Error(
                'The delivered supporting course did not retain its issuer, learner, and credential binding.'
            );
        }
        statusEntries(credential, envConfig.network);
        const changed =
            purpose === 'revocation'
                ? await districts[1].invoke.revokeBoostRecipient(boost, profileId, uri)
                : await districts[1].invoke.suspendBoostRecipient(boost, profileId, uri);
        if (changed !== true)
            throw new Error(`The supporting course could not be marked for ${purpose}.`);
        const verification = await districts[1].invoke.verifyCredential(credential);
        if (
            !verification.checks.includes('proof') ||
            !verification.status?.some(
                (entry: { statusPurpose: string; isSet: boolean }) =>
                    entry.statusPurpose === purpose && entry.isSet === true
            )
        ) {
            throw new Error(`The network did not confirm the published ${purpose} status.`);
        }
        supporting.push(credential);
    }

    const tampered = structuredClone(second) as Document;
    if (!tampered.credentialSubject.achievement)
        throw new Error('The signed course has no achievement.');
    tampered.credentialSubject.achievement.name = 'Tampered nested record';
    const unsigned = makeChild(children[2], districts[1].id.did());
    const scenarios: Array<{ name: string; expected: string; records: Document[] }> = [
        {
            name: 'All verified',
            expected: 'All nested records verify.',
            records: [valid, second, valid, second],
        },
        {
            name: 'Revoked record',
            expected: 'One nested record is revoked.',
            records: [valid, supporting[0], valid, second],
        },
        {
            name: 'Suspended record',
            expected: 'One nested record is suspended.',
            records: [valid, supporting[1], valid, second],
        },
        {
            name: 'Tampered signature',
            expected: 'One nested signature fails; the outer signature remains valid.',
            records: [valid, tampered, valid, second],
        },
        {
            name: 'Mixed signed/unsigned',
            expected: 'One nested record is unsigned.',
            records: [valid, unsigned, valid, second],
        },
    ];
    for (const scenario of scenarios) {
        const outer = structuredClone(blueprint);
        outer.id = `urn:uuid:${crypto.randomUUID()}`;
        outer.name = `${scenario.name} — ${label}`;
        if (typeof outer.issuer === 'string') outer.issuer = { id: publisher.did };
        else outer.issuer.id = publisher.did;
        outer.credentialSubject.id = learner.did;
        outer.credentialSubject.verifiableCredential = structuredClone(scenario.records);
        const signed = await wallet.invoke.issueCredential(outer);
        const uri = await wallet.invoke.sendCredential(profileId, signed, {
            category: 'Learning History',
        });
        if (typeof uri !== 'string' || !uri) throw new Error('CLR delivery returned no receipt.');
        const delivery = { name: outer.name as string, uri, expected: scenario.expected };
        result.deliveries.push(delivery);
        report(`${scenario.name} delivered.`, delivery);
    }
    return result;
};
