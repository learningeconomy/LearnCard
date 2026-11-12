import { randomBytes, randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import {
    JWKWithPrivateKeyValidator,
    VCValidator,
    type CreateReadableDeliveryRecipient,
    type ReadableDeliveryRecipient,
    type ReadableDeliveryPage,
    type ReadableDeliveryReadInput,
    type ReadableDeliveryCredential,
    type ConsentFlowContractDataForDid,
} from '@learncard/types';
import { environment } from '@environment';
import { getEmptyLearnCard } from './learnCard.helpers';
import { getDidWeb } from './did.helpers';
import { getUriParts } from './uri.helpers';
import { getProfileByDid } from '@accesslayer/profile/read';
import { getConsentedDataBetweenProfiles } from '@accesslayer/consentflowcontract/relationships/read';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { deleteDidDocForProfile } from '@cache/did-docs';
import {
    getDeliveryRecord,
    getDeliveryProvision,
    createDeliveryRecipient,
    disableDeliveryRecipient,
} from '@accesslayer/readable-delivery';
import { createDeliveryKeyCustody } from './readable-delivery-keys.helpers';
import { readDeliveryCiphertext } from './readable-delivery-storage.helpers';
import type { DeliveryRecord } from 'types/readable-delivery';

const unavailable = (): TRPCError =>
    new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Readable delivery is unavailable.' });
const denied = (): TRPCError =>
    new TRPCError({
        code: 'FORBIDDEN',
        message: 'This information is not available for readable delivery.',
    });

export const isLocalDeliveryRuntime = (): boolean =>
    environment.IS_OFFLINE &&
    environment.NODE_ENV !== 'production' &&
    !environment.AWS_LAMBDA_FUNCTION_NAME &&
    !environment.LAMBDA_STAGE;

const custody = (): ReturnType<typeof createDeliveryKeyCustody> => {
    if (!environment.READABLE_DELIVERY_ENABLED) throw unavailable();
    if (
        !isLocalDeliveryRuntime() &&
        (environment.AWS_ENDPOINT_URL || environment.AWS_ENDPOINT_URL_KMS)
    )
        throw unavailable();
    try {
        return createDeliveryKeyCustody({
            kmsKeyArn: environment.READABLE_DELIVERY_KMS_KEY_ARN,
            region: environment.AWS_REGION,
            localKey: environment.READABLE_DELIVERY_LOCAL_KEY,
            local: isLocalDeliveryRuntime(),
        });
    } catch {
        throw unavailable();
    }
};

const publicRecipient = (record: DeliveryRecord): ReadableDeliveryRecipient => ({
    profileId: record.profileId,
    did: getDidWeb(record.domain, record.profileId),
    displayName: record.displayName,
    agentDid: record.agentDid,
    enabled: record.enabled,
    disclosureVersion: '1',
});

/** Create a fresh, explicitly delegated recipient; never modify an existing profile's audience. */
export const provisionReadableDelivery = async (
    owner: string,
    domain: string,
    input: CreateReadableDeliveryRecipient
): Promise<ReadableDeliveryRecipient> => {
    const keys = custody();
    const provisionId = `${domain}:${owner}:${input.requestId}`;
    const reuse = (record: DeliveryRecord): ReadableDeliveryRecipient => {
        if (
            record.ownerProfileId !== owner ||
            record.domain !== domain ||
            record.displayName !== input.displayName ||
            !record.enabled
        )
            throw denied();
        return publicRecipient(record);
    };
    const previous = await getDeliveryProvision(provisionId);
    if (previous) return reuse(previous);
    const wallet = await getEmptyLearnCard();
    const entropy = randomBytes(32);
    const recipientEntropy = randomBytes(32);
    try {
        const key = await wallet.invoke.generateEd25519KeyFromBytes(entropy);
        const agentDid = await wallet.invoke.keyToDid('key', key);
        const recipientDid = await wallet.invoke.keyToDid(
            'key',
            await wallet.invoke.generateEd25519KeyFromBytes(recipientEntropy)
        );
        const binding = { profileId: `rd-${randomUUID()}`, domain, version: 1 };
        const encrypted = await keys.encrypt(JSON.stringify(key), binding);
        const record: DeliveryRecord = {
            ...binding,
            ...encrypted,
            provisionId,
            agentDid,
            agentProfileId: `rda-${randomUUID().replaceAll('-', '')}`,
            ownerProfileId: owner,
            displayName: input.displayName,
            enabled: true,
            disclosureVersion: '1',
        };
        await createDeliveryRecipient(record, recipientDid);
        return publicRecipient(record);
    } catch {
        // A concurrent request may have committed the unique provision, or the
        // database response may have been lost after commit. Reuse that result.
        const committed = await getDeliveryProvision(provisionId).catch(() => undefined);
        if (committed) return reuse(committed);
        throw unavailable();
    } finally {
        entropy.fill(0);
        recipientEntropy.fill(0);
    }
};

export const disableReadableDelivery = async (
    profileId: string,
    domain: string,
    owner: string
): Promise<void> => {
    if (!(await disableDeliveryRecipient(profileId, domain, owner))) throw denied();
    await deleteDidDocForProfile(profileId);
};

export const isDeliveryConsentReadable = (record: ConsentFlowContractDataForDid): boolean =>
    (record.status === 'live' || record.status === 'consumed') &&
    (!record.guardian?.required || record.guardian.approved === true);

const readGrant = async (
    recipient: string,
    domain: string,
    input: ReadableDeliveryReadInput
): Promise<ConsentFlowContractDataForDid> => {
    const contract = getUriParts(input.contractUri);
    if (contract.type !== 'contract' || contract.domain !== `${domain.replace(/\/trpc$/, '')}/trpc`)
        throw denied();
    if (!input.did.startsWith('did:key:') && !input.did.startsWith(`did:web:${domain}:users:`))
        throw denied();
    const other = await getProfileByDid(input.did);
    if (!other || (input.did !== other.did && input.did !== getDidWeb(domain, other.profileId)))
        throw denied();
    const result = await getConsentedDataBetweenProfiles(recipient, other.profileId, {
        query: { id: contract.id },
        limit: 1,
        domain,
    });
    const grant = result.records[0];
    if (!grant || !isDeliveryConsentReadable(grant)) throw denied();
    return grant;
};

const requireEnabled = async (recipient: string, domain: string): Promise<DeliveryRecord> => {
    const record = await getDeliveryRecord(recipient, domain);
    if (!record?.enabled) throw denied();
    const managers = await getProfilesThatManageAProfile(recipient);
    if (
        !managers.some(
            manager =>
                manager.profileId === record.agentProfileId && manager.did === record.agentDid
        )
    )
        throw denied();
    return record;
};

/** Return only a bounded projection of current consent; plaintext never leaves request memory except in the response. */
export const readReadableDelivery = async (
    recipient: string,
    domain: string,
    input: ReadableDeliveryReadInput
): Promise<ReadableDeliveryPage> => {
    const keys = custody();
    const delivery = await requireEnabled(recipient, domain);
    const grant = await readGrant(recipient, domain, input);
    const start = Number(input.cursor ?? 0);
    const limit = input.limit ?? 10;
    const selected = grant.credentials.slice(start, start + limit);
    const wallet = await getEmptyLearnCard();
    let key;
    try {
        key = JWKWithPrivateKeyValidator.parse(JSON.parse(await keys.decrypt(delivery, delivery)));
        if ((await wallet.invoke.keyToDid('key', key)) !== delivery.agentDid) throw new Error();
    } catch {
        throw unavailable();
    }
    const records: ReadableDeliveryCredential[] = [];
    const signal = AbortSignal.timeout(12_000);
    for (const item of selected) {
        let ciphertext;
        try {
            ciphertext = await readDeliveryCiphertext(item.uri, {
                domain,
                cloudUrl: environment.READABLE_DELIVERY_CLOUD_URL,
                cloudInternalUrl: environment.READABLE_DELIVERY_CLOUD_INTERNAL_URL,
                local: isLocalDeliveryRuntime(),
                signal,
            });
        } catch {
            records.push({ ...item, status: 'unavailable' });
            continue;
        }
        let plaintext: unknown;
        try {
            plaintext = await wallet.invoke.decryptDagJwe(ciphertext, [key]);
        } catch {
            records.push({ ...item, status: 'unreadable' });
            continue;
        }
        if (!plaintext) {
            records.push({ ...item, status: 'unreadable' });
            continue;
        }
        const parsed = VCValidator.safeParse(plaintext);
        if (!parsed.success) {
            records.push({ ...item, status: 'invalid' });
            continue;
        }
        const vc = parsed.data;
        const issuer = typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id;
        if (!issuer) {
            records.push({ ...item, status: 'invalid' });
            continue;
        }
        let proof: 'valid' | 'invalid' | 'not_checked' = 'not_checked';
        // Arbitrary DID URLs can trigger network requests. Only did:key proofs are
        // checked here; full issuer trust/status evaluation belongs to the verifier.
        const proofs = Array.isArray(vc.proof) ? vc.proof : [vc.proof];
        if (
            issuer.startsWith('did:key:') &&
            proofs.every(
                p =>
                    typeof p?.verificationMethod === 'string' &&
                    p.verificationMethod.startsWith(`${issuer}#`)
            )
        ) {
            try {
                const result = await wallet.invoke.verifyCredential(vc, { checks: ['proof'] });
                proof =
                    result.errors.length === 0 &&
                    result.warnings.length === 0 &&
                    result.checks.includes('proof')
                        ? 'valid'
                        : 'invalid';
            } catch {
                proof = 'invalid';
            }
        }
        const text = (value: unknown): string | undefined =>
            typeof value === 'string' ? value.slice(0, 2048) : undefined;
        records.push({
            ...item,
            status: 'readable',
            credential: {
                name: text(vc.name),
                type: vc.type,
                issuer,
                issuanceDate: text(vc.issuanceDate),
                expirationDate: text(vc.expirationDate),
                validFrom: text(vc.validFrom),
                validUntil: text(vc.validUntil),
                boostUri: text(vc.boostId),
                verification: { proof, status: 'not_checked' },
            },
        });
    }
    // Decryption/fetch may have taken time. Reauthorize before releasing any result.
    await requireEnabled(recipient, domain);
    const current = await readGrant(recipient, domain, input);
    if (
        selected.some(
            item =>
                !current.credentials.some(
                    now => now.uri === item.uri && now.category === item.category
                )
        )
    )
        throw denied();
    const hasMore = start + selected.length < grant.credentials.length;
    return { records, hasMore, ...(hasMore ? { cursor: String(start + selected.length) } : {}) };
};
