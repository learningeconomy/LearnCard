import { createHash } from 'node:crypto';

import {
    BundleManifestValidator,
    IntegrationManifestValidator,
    WalletManifestValidator,
} from '@learncard/types';
import type {
    BundleManifest,
    DidDocument,
    IntegrationManifest,
    ManifestSignature,
    VerificationMethod,
    WalletManifest,
} from '@learncard/types';
import { base58btc } from 'multiformats/bases/base58';
import { base64url } from 'multiformats/bases/base64';
import { CompactSign, compactVerify, importJWK } from 'jose';
import type { JWK } from 'jose';
import { TRPCError } from '@trpc/server';

import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import type { AppStoreListingKind } from 'types/app-store-listing';
import type { ListingVersionType } from 'types/listing-version';

type SignedManifest = IntegrationManifest | WalletManifest | BundleManifest;

const stableSortValue = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stableSortValue);

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce<Record<string, unknown>>((acc, key) => {
                acc[key] = stableSortValue((value as Record<string, unknown>)[key]);
                return acc;
            }, {});
    }

    return value;
};

export const canonicalizeManifestForSignature = <T extends { signature?: unknown }>(
    manifest: T
): string => {
    const { signature: _signature, ...unsignedManifest } = manifest;
    return JSON.stringify(stableSortValue(unsignedManifest));
};

export const computeManifestHash = (manifest: { signature?: unknown }): string =>
    createHash('sha256').update(canonicalizeManifestForSignature(manifest)).digest('hex');

const extractFragment = (value: string): string | undefined => {
    const index = value.lastIndexOf('#');
    if (index === -1) return value.length > 0 ? value : undefined;
    const fragment = value.slice(index + 1);
    return fragment.length > 0 ? fragment : undefined;
};

const findVerificationMethod = (
    document: DidDocument,
    publisherDid: string,
    verificationMethodId: string
): Exclude<VerificationMethod, string> => {
    const methods = (document.verificationMethod ?? []).filter(
        (entry): entry is Exclude<VerificationMethod, string> =>
            typeof entry === 'object' && entry !== null && typeof entry.id === 'string'
    );
    const requestedFragment = extractFragment(verificationMethodId);

    const match = methods.find(method => {
        if (method.id === verificationMethodId) return true;
        if (method.id === `${publisherDid}${verificationMethodId}`) return true;
        const methodFragment = extractFragment(method.id);
        return Boolean(requestedFragment && methodFragment === requestedFragment);
    });

    if (!match) {
        throw new Error(
            `Verification method ${verificationMethodId} was not found for publisher DID ${publisherDid}.`
        );
    }

    return match;
};

const isAuthorizedForAssertion = (
    document: DidDocument,
    publisherDid: string,
    verificationMethodId: string
): boolean => {
    const assertionMethods = document.assertionMethod ?? [];
    const requestedFragment = extractFragment(verificationMethodId);

    return assertionMethods.some(entry => {
        if (typeof entry === 'string') {
            if (entry === verificationMethodId) return true;
            if (entry === `${publisherDid}${verificationMethodId}`) return true;
            return Boolean(requestedFragment && extractFragment(entry) === requestedFragment);
        }

        if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') return false;
        if (entry.id === verificationMethodId) return true;
        return Boolean(requestedFragment && extractFragment(entry.id) === requestedFragment);
    });
};

const getPublicJwkFromVerificationMethod = (
    verificationMethod: Exclude<VerificationMethod, string>
): JWK => {
    if (verificationMethod.publicKeyJwk) {
        return verificationMethod.publicKeyJwk as JWK;
    }

    if (verificationMethod.publicKeyMultibase) {
        const decoded = base58btc.decode(verificationMethod.publicKeyMultibase);
        const keyBytes = decoded[0] === 0xed && decoded[1] === 0x01 ? decoded.slice(2) : decoded;

        return {
            kty: 'OKP',
            crv: 'Ed25519',
            x: base64url.encode(keyBytes).slice(1),
        };
    }

    if (verificationMethod.publicKeyBase58) {
        const keyBytes = base58btc.baseDecode(verificationMethod.publicKeyBase58);

        return {
            kty: 'OKP',
            crv: 'Ed25519',
            x: base64url.encode(keyBytes).slice(1),
        };
    }

    throw new Error(
        `Verification method ${verificationMethod.id} does not expose a supported public key format.`
    );
};

export const verifyManifestSignature = async (manifest: SignedManifest): Promise<void> => {
    const learnCard = await getEmptyLearnCard();
    const payload = new TextEncoder().encode(canonicalizeManifestForSignature(manifest));
    const signature = manifest.signature as ManifestSignature;
    const didDocument = await learnCard.invoke.resolveDid(manifest.publisherDid);
    const verificationMethod = findVerificationMethod(
        didDocument,
        manifest.publisherDid,
        signature.verificationMethod
    );

    if (!isAuthorizedForAssertion(didDocument, manifest.publisherDid, verificationMethod.id)) {
        throw new Error(
            `Verification method ${verificationMethod.id} is not authorized for assertion on ${manifest.publisherDid}.`
        );
    }

    const publicJwk = getPublicJwkFromVerificationMethod(verificationMethod);
    const key = await importJWK(publicJwk, signature.alg);
    const protectedHeader = await compactVerify(signature.sig, key);

    if (new TextDecoder().decode(protectedHeader.payload) !== new TextDecoder().decode(payload)) {
        throw new Error('Manifest signature payload does not match the canonical manifest.');
    }

    if (
        typeof protectedHeader.protectedHeader.kid === 'string' &&
        protectedHeader.protectedHeader.kid !== verificationMethod.id
    ) {
        const headerFragment = extractFragment(protectedHeader.protectedHeader.kid);
        const methodFragment = extractFragment(verificationMethod.id);

        if (!headerFragment || headerFragment !== methodFragment) {
            throw new Error(
                'Manifest signature kid does not match the declared verificationMethod.'
            );
        }
    }

    if (protectedHeader.protectedHeader.alg !== signature.alg) {
        throw new Error('Manifest signature alg does not match the declared signature metadata.');
    }
};

export const signManifestWithDidKey = async <T extends SignedManifest>(
    manifest: Omit<T, 'signature'>,
    seed: string
): Promise<T> => {
    const learnCard = await getLearnCard(seed);

    if (learnCard.id.did() !== manifest.publisherDid) {
        throw new Error(
            'signManifestWithDidKey only supports did:key manifests for the supplied seed.'
        );
    }

    const keypair = learnCard.id.keypair() as JWK | undefined;
    if (!keypair?.d) {
        throw new Error('Signing keypair is missing a private JWK.');
    }

    const verificationMethod = await learnCard.invoke.didToVerificationMethod(
        manifest.publisherDid
    );
    const payload = new TextEncoder().encode(
        canonicalizeManifestForSignature(manifest as Omit<T, 'signature'> & { signature?: unknown })
    );
    const key = await importJWK(keypair, 'EdDSA');
    const sig = await new CompactSign(payload)
        .setProtectedHeader({ alg: 'EdDSA', kid: verificationMethod })
        .sign(key);

    return {
        ...manifest,
        signature: {
            alg: 'EdDSA',
            sig,
            verificationMethod,
        },
    } as T;
};

export const parseSignedManifestForListingKind = (
    kind: AppStoreListingKind,
    manifestJson: string
): SignedManifest => {
    const parsed = JSON.parse(manifestJson);

    switch (kind) {
        case 'INTEGRATION':
            return IntegrationManifestValidator.parse(parsed);
        case 'WALLET':
            return WalletManifestValidator.parse(parsed);
        case 'BUNDLE':
            return BundleManifestValidator.parse(parsed);
        case 'APP':
            throw new Error('APP listings do not use signed manifests in Phase C.');
    }
};

export const listingKindRequiresSignedManifest = (kind: AppStoreListingKind): boolean =>
    kind === 'INTEGRATION' || kind === 'WALLET' || kind === 'BUNDLE';

export const assertValidSignedListingVersion = async (
    kind: AppStoreListingKind,
    version: ListingVersionType
): Promise<SignedManifest> => {
    if (!listingKindRequiresSignedManifest(kind)) {
        throw new Error(`Listing kind ${kind} does not require a signed manifest.`);
    }

    if (!version.manifest_json) {
        throw new Error('ListingVersion is missing manifest_json.');
    }

    const manifest = parseSignedManifestForListingKind(kind, version.manifest_json);
    // Hash and verify over the RAW stored manifest — the exact payload the
    // publisher signed. Zod parsing materializes schema defaults, which must
    // never alter the canonical hash: a schema revision adding a default would
    // otherwise silently invalidate every previously signed manifest.
    const rawManifest = JSON.parse(version.manifest_json) as SignedManifest;
    const manifestHash = computeManifestHash(rawManifest);

    if (version.publisher_did && version.publisher_did !== manifest.publisherDid) {
        throw new Error('ListingVersion publisher DID does not match the manifest publisher DID.');
    }

    if (version.signature && version.signature !== manifest.signature.sig) {
        throw new Error('ListingVersion signature does not match the manifest signature.');
    }

    if (version.manifest_hash && version.manifest_hash !== manifestHash) {
        throw new Error('ListingVersion manifest hash does not match the canonical manifest hash.');
    }

    await verifyManifestSignature(rawManifest);

    return manifest;
};

export const assertSignedListingVersionOrThrow = async (
    kind: AppStoreListingKind,
    version: ListingVersionType,
    messagePrefix = 'Manifest validation failed'
): Promise<SignedManifest> => {
    try {
        return await assertValidSignedListingVersion(kind, version);
    } catch (error) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `${messagePrefix}: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
};
