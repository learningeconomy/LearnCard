import crypto from 'node:crypto';

import { MongoClient } from 'mongodb';
import { TRPCError } from '@trpc/server';
import type { UnsignedVC } from '@learncard/types';
import type { InlineCredentialTemplate, VariableManifest } from '@learncard/partner-connect-core';
import {
    canonicalJsonString,
    compileInlineTemplate,
    validateInlineTemplate,
    validateTemplateData,
} from '@learncard/partner-connect-core';

import { getBoostUri } from '@helpers/boost.helpers';
import { getAppDidWeb, getDidWeb } from '@helpers/did.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { inflateObject } from '@helpers/objects.helpers';
import { createBoostForListing } from '@accesslayer/boost/create';
import { updateBoost } from '@accesslayer/boost/update';
import { removeBoostFromListing } from '@accesslayer/app-store-listing/relationships/delete';
import {
    associateBoostWithListing,
    associateListingWithSigningAuthority,
} from '@accesslayer/app-store-listing/relationships/create';
import { getBoostForListingByTemplateAlias } from '@accesslayer/app-store-listing/relationships/read';
import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import {
    getPrimarySigningAuthorityForListing,
    getPrimarySigningAuthorityForIntegration,
    getPrimarySigningAuthorityForUser,
} from '@accesslayer/signing-authority/relationships/read';
import {
    invalidateBoostForListingCache,
    invalidateListingSigningAuthorityCache,
} from '@cache/app-store.caches';
import { deleteDidDocForProfile } from '@cache/did-docs';
import { neogma } from '@instance';
import { Boost, type BoostInstance } from '@models';
import type { AppStoreListingType } from 'types/app-store-listing';
import type { IntegrationType } from 'types/integration';
import type { ProfileType, SigningAuthorityForUserType } from 'types/profile';

type InlineTemplateBoostMeta = {
    integrationId?: string;
    templateAlias?: string;
    inlineTemplateHash?: string;
    inlineTemplateVersion?: number;
    inlineVariableManifest?: string;
    source?: string;
    supersededAt?: string;
    supersededBy?: string;
};

type UpsertInlineTemplateBoostResult = {
    boost: BoostInstance;
    boostUri: string;
    templateVersion: number;
    manifest: VariableManifest;
};

const INLINE_TEMPLATE_SOURCE = 'partner-connect-inline';
const DEFAULT_SIGNING_AUTHORITY_ENDPOINT =
    process.env.SIGNING_AUTHORITY_ENDPOINT ?? 'http://localhost:5100/api';
const DEFAULT_MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/?replicaSet=rs0';
const DEFAULT_MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lca-api';
const MAX_SIGNING_AUTHORITY_NAME_LENGTH = 15;
const SIGNING_AUTHORITY_PREFIX = 'app-';

const getBoostMeta = (boost: BoostInstance): InlineTemplateBoostMeta => {
    const inflated = inflateObject<Record<string, unknown>>(
        boost.getDataValues() as Record<string, unknown>
    );
    return (inflated.meta as InlineTemplateBoostMeta | undefined) ?? {};
};

export const readInlineTemplateBoostMeta = async (
    boostOrId: BoostInstance | string
): Promise<InlineTemplateBoostMeta> => {
    const boostId = typeof boostOrId === 'string' ? boostOrId : boostOrId.id;
    const inMemoryMeta = typeof boostOrId === 'string' ? undefined : getBoostMeta(boostOrId);

    if (
        inMemoryMeta?.inlineTemplateHash ||
        typeof inMemoryMeta?.inlineTemplateVersion === 'number' ||
        inMemoryMeta?.templateAlias
    ) {
        return inMemoryMeta;
    }

    const result = await neogma.queryRunner.run(
        `MATCH (boost:Boost {id: $boostId})
         RETURN boost.\`meta.integrationId\` AS integrationId,
                boost.\`meta.templateAlias\` AS templateAlias,
                boost.\`meta.inlineTemplateHash\` AS inlineTemplateHash,
                boost.\`meta.inlineTemplateVersion\` AS inlineTemplateVersion,
                boost.\`meta.inlineVariableManifest\` AS inlineVariableManifest,
                boost.\`meta.source\` AS source,
                boost.\`meta.supersededAt\` AS supersededAt,
                boost.\`meta.supersededBy\` AS supersededBy`,
        { boostId }
    );

    const record = result.records[0];

    if (!record) {
        return {};
    }

    const rawVersion = record.get('inlineTemplateVersion') as { toNumber?: () => number } | number;

    return {
        integrationId: record.get('integrationId') ?? undefined,
        templateAlias: record.get('templateAlias') ?? undefined,
        inlineTemplateHash: record.get('inlineTemplateHash') ?? undefined,
        inlineTemplateVersion:
            typeof rawVersion === 'number' ? rawVersion : rawVersion?.toNumber?.(),
        inlineVariableManifest: record.get('inlineVariableManifest') ?? undefined,
        source: record.get('source') ?? undefined,
        supersededAt: record.get('supersededAt') ?? undefined,
        supersededBy: record.get('supersededBy') ?? undefined,
    };
};

const joinTemplateErrors = (errors: Array<{ message: string }>): string => {
    return errors.map(error => error.message).join('; ');
};

export const getInlineTemplateVersion = (boost: BoostInstance): number | undefined => {
    const version = getBoostMeta(boost).inlineTemplateVersion;
    return typeof version === 'number' && Number.isFinite(version) ? version : undefined;
};

export const getInlineTemplateHashForBoost = (boost: BoostInstance): string | undefined => {
    const inlineTemplateHash = getBoostMeta(boost).inlineTemplateHash;
    return typeof inlineTemplateHash === 'string' ? inlineTemplateHash : undefined;
};

export const isInlineTemplateBoostVersionMatch = (
    boost: BoostInstance,
    templateHash: string,
    templateVersion: number
): boolean => {
    return (
        getInlineTemplateHashForBoost(boost) === templateHash &&
        getInlineTemplateVersion(boost) === templateVersion
    );
};

export const computeInlineTemplateHash = (
    template: InlineCredentialTemplate
): {
    credentialTemplateJson: string;
    variableManifest: VariableManifest;
    category: string;
    walletSkills?: unknown;
    contentHash: string;
} => {
    const compiled = compileInlineTemplate(template);
    const contentHash = crypto
        .createHash('sha256')
        .update(
            canonicalJsonString({
                credentialTemplateJson: compiled.credentialTemplateJson,
                category: compiled.category,
                walletSkills: compiled.walletSkills,
            })
        )
        .digest('hex');

    return {
        ...compiled,
        contentHash,
    };
};

export const validateInlineTemplateOrThrow = (template: InlineCredentialTemplate): void => {
    const errors = validateInlineTemplate(template);

    if (errors.length === 0) {
        return;
    }

    throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `TEMPLATE_INVALID: ${joinTemplateErrors(errors)}`,
    });
};

export const validateInlineTemplateDataOrThrow = (
    manifest: VariableManifest,
    templateData: Record<string, unknown> | undefined
): void => {
    const errors = validateTemplateData(manifest, templateData);

    if (errors.length === 0) {
        return;
    }

    throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `TEMPLATE_DATA_INVALID: ${joinTemplateErrors(errors)}`,
    });
};

const ensureListingSigningAuthorityRelationship = async (
    listing: AppStoreListingType,
    signingAuthority: SigningAuthorityForUserType
): Promise<void> => {
    const listingSigningAuthority = await getPrimarySigningAuthorityForListing(listing);

    if (
        listingSigningAuthority &&
        listingSigningAuthority.signingAuthority.endpoint ===
            signingAuthority.signingAuthority.endpoint &&
        listingSigningAuthority.relationship.name === signingAuthority.relationship.name &&
        listingSigningAuthority.relationship.did === signingAuthority.relationship.did
    ) {
        return;
    }

    await associateListingWithSigningAuthority(
        listing.listing_id,
        signingAuthority.signingAuthority.endpoint,
        {
            name: signingAuthority.relationship.name,
            did: signingAuthority.relationship.did,
            isPrimary: true,
        }
    );

    invalidateListingSigningAuthorityCache(listing.listing_id);
};

const buildManagedSigningAuthorityName = (listing: AppStoreListingType): string => {
    const base = (listing.slug || listing.listing_id).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const trimmed = base.slice(
        0,
        MAX_SIGNING_AUTHORITY_NAME_LENGTH - SIGNING_AUTHORITY_PREFIX.length
    );
    return `${SIGNING_AUTHORITY_PREFIX}${trimmed || 'app'}`.slice(
        0,
        MAX_SIGNING_AUTHORITY_NAME_LENGTH
    );
};

const createManagedSigningAuthorityDocument = async (
    ownerDid: string,
    name: string
): Promise<string> => {
    const seed =
        process.env.NODE_ENV === 'test' ? 'e'.repeat(64) : crypto.randomBytes(32).toString('hex');
    const signingAuthorityLearnCard = await getLearnCard(seed);
    const did = signingAuthorityLearnCard.id.did();

    let client: MongoClient | undefined;

    try {
        client = new MongoClient(DEFAULT_MONGO_URI);
        await client.connect();

        const db = client.db(DEFAULT_MONGO_DB_NAME);
        const collection = db.collection('signingauthorities');
        const existing = await collection.findOne({ ownerDid, name });

        if (existing?.did && typeof existing.did === 'string') {
            return existing.did;
        }

        await collection.updateOne(
            { ownerDid, name },
            {
                $setOnInsert: {
                    _id: crypto.randomUUID(),
                },
                $set: {
                    ownerDid,
                    name,
                    seed,
                    did,
                },
            },
            { upsert: true }
        );

        return did;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Unable to auto-provision app signing authority: ${message}`,
        });
    } finally {
        await client?.close();
    }
};

export const ensureManagedSigningAuthorityForListing = async (
    listing: AppStoreListingType,
    integration: IntegrationType,
    integrationOwner: ProfileType,
    domain: string
): Promise<SigningAuthorityForUserType> => {
    const existingListingSa = await getPrimarySigningAuthorityForListing(listing);
    if (existingListingSa) {
        return existingListingSa;
    }

    const existingIntegrationSa = await getPrimarySigningAuthorityForIntegration(integration.id);
    if (existingIntegrationSa) {
        await ensureListingSigningAuthorityRelationship(listing, existingIntegrationSa);
        return existingIntegrationSa;
    }

    const existingOwnerSa = await getPrimarySigningAuthorityForUser(integrationOwner);
    if (existingOwnerSa) {
        await ensureListingSigningAuthorityRelationship(listing, existingOwnerSa);
        return existingOwnerSa;
    }

    const ownerDid = listing.slug
        ? getAppDidWeb(domain, listing.slug)
        : getDidWeb(domain, integrationOwner.profileId);
    const name = buildManagedSigningAuthorityName(listing);
    const did = await createManagedSigningAuthorityDocument(ownerDid, name);
    const signingAuthority = await upsertSigningAuthority(DEFAULT_SIGNING_AUTHORITY_ENDPOINT);

    await createUseSigningAuthorityRelationship(
        integrationOwner,
        signingAuthority,
        name,
        did,
        true
    );
    await associateListingWithSigningAuthority(
        listing.listing_id,
        DEFAULT_SIGNING_AUTHORITY_ENDPOINT,
        {
            name,
            did,
            isPrimary: true,
        }
    );
    invalidateListingSigningAuthorityCache(listing.listing_id);
    await deleteDidDocForProfile(integrationOwner.profileId);

    return {
        signingAuthority: { endpoint: DEFAULT_SIGNING_AUTHORITY_ENDPOINT },
        relationship: { name, did, isPrimary: true },
    } as SigningAuthorityForUserType;
};

const getReusableInlineTemplateBoost = async ({
    integrationId,
    templateAlias,
    contentHash,
    templateVersion,
}: {
    integrationId: string;
    templateAlias: string;
    contentHash: string;
    templateVersion: number;
}): Promise<BoostInstance | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (boost:Boost)
         WHERE boost.\`meta.integrationId\` = $integrationId
           AND boost.\`meta.templateAlias\` = $templateAlias
           AND boost.\`meta.inlineTemplateHash\` = $contentHash
           AND boost.\`meta.inlineTemplateVersion\` = $templateVersion
         RETURN boost.id AS id
         ORDER BY boost.id DESC
         LIMIT 1`,
        {
            integrationId,
            templateAlias,
            contentHash,
            templateVersion,
        }
    );

    const id = result.records[0]?.get('id');

    if (typeof id !== 'string') {
        return null;
    }

    return Boost.findOne({ where: { id } });
};

export const upsertInlineTemplateBoostForListing = async ({
    listing,
    integration,
    templateAlias,
    template,
    domain,
    desiredVersion,
}: {
    listing: AppStoreListingType;
    integration: IntegrationType;
    templateAlias: string;
    template: InlineCredentialTemplate;
    domain: string;
    desiredVersion?: number;
}): Promise<UpsertInlineTemplateBoostResult> => {
    validateInlineTemplateOrThrow(template);

    const { credentialTemplateJson, variableManifest, category, walletSkills, contentHash } =
        computeInlineTemplateHash(template);
    const existing = await getBoostForListingByTemplateAlias(
        listing.listing_id,
        templateAlias,
        domain
    );

    if (existing) {
        const existingMeta = await readInlineTemplateBoostMeta(existing.boost);
        const existingVersion =
            typeof existingMeta.inlineTemplateVersion === 'number'
                ? existingMeta.inlineTemplateVersion
                : 1;
        const targetVersion = desiredVersion ?? existingVersion;

        if (existingMeta.inlineTemplateHash === contentHash && existingVersion === targetVersion) {
            return {
                boost: existing.boost,
                boostUri: existing.boostUri,
                templateVersion: targetVersion,
                manifest: variableManifest,
            };
        }

        const reusableBoost = await getReusableInlineTemplateBoost({
            integrationId: integration.id,
            templateAlias,
            contentHash,
            templateVersion: targetVersion,
        });

        if (reusableBoost) {
            const reusableBoostUri = getBoostUri(reusableBoost.id, domain);

            await updateBoost(existing.boost, {
                meta: {
                    supersededAt: new Date().toISOString(),
                    supersededBy: reusableBoostUri,
                },
            });
            await removeBoostFromListing(listing.listing_id, templateAlias);
            await associateBoostWithListing(listing.listing_id, reusableBoostUri, templateAlias);
            invalidateBoostForListingCache(listing.listing_id, templateAlias, domain);

            return {
                boost: reusableBoost,
                boostUri: reusableBoostUri,
                templateVersion: targetVersion,
                manifest: variableManifest,
            };
        }

        const nextVersion = desiredVersion ?? existingVersion + 1;

        const newBoost = await createBoostForListing(
            parseInlineTemplateJson(credentialTemplateJson) as UnsignedVC,
            listing,
            {
                status: 'LIVE',
                category,
                meta: {
                    integrationId: integration.id,
                    templateAlias,
                    inlineTemplateHash: contentHash,
                    inlineTemplateVersion: nextVersion,
                    inlineVariableManifest: JSON.stringify(variableManifest),
                    inlineWalletSkills: walletSkills ? JSON.stringify(walletSkills) : undefined,
                    source: INLINE_TEMPLATE_SOURCE,
                },
            },
            domain
        );
        const newBoostUri = getBoostUri(newBoost.id, domain);

        await updateBoost(existing.boost, {
            meta: {
                supersededAt: new Date().toISOString(),
                supersededBy: newBoostUri,
            },
        });
        await removeBoostFromListing(listing.listing_id, templateAlias);
        await associateBoostWithListing(listing.listing_id, newBoostUri, templateAlias);
        invalidateBoostForListingCache(listing.listing_id, templateAlias, domain);

        return {
            boost: newBoost,
            boostUri: newBoostUri,
            templateVersion: nextVersion,
            manifest: variableManifest,
        };
    }

    const initialVersion = desiredVersion ?? 1;

    const reusableBoost = await getReusableInlineTemplateBoost({
        integrationId: integration.id,
        templateAlias,
        contentHash,
        templateVersion: initialVersion,
    });

    if (reusableBoost) {
        const reusableBoostUri = getBoostUri(reusableBoost.id, domain);

        await associateBoostWithListing(listing.listing_id, reusableBoostUri, templateAlias);
        invalidateBoostForListingCache(listing.listing_id, templateAlias, domain);

        return {
            boost: reusableBoost,
            boostUri: reusableBoostUri,
            templateVersion: initialVersion,
            manifest: variableManifest,
        };
    }

    const boost = await createBoostForListing(
        parseInlineTemplateJson(credentialTemplateJson) as UnsignedVC,
        listing,
        {
            status: 'LIVE',
            category,
            meta: {
                integrationId: integration.id,
                templateAlias,
                inlineTemplateHash: contentHash,
                inlineTemplateVersion: initialVersion,
                inlineVariableManifest: JSON.stringify(variableManifest),
                inlineWalletSkills: walletSkills ? JSON.stringify(walletSkills) : undefined,
                source: INLINE_TEMPLATE_SOURCE,
            },
        },
        domain
    );
    const boostUri = getBoostUri(boost.id, domain);

    await associateBoostWithListing(listing.listing_id, boostUri, templateAlias);
    invalidateBoostForListingCache(listing.listing_id, templateAlias, domain);

    return {
        boost,
        boostUri,
        templateVersion: initialVersion,
        manifest: variableManifest,
    };
};

const parseInlineTemplateJson = (templateJson: string): Record<string, unknown> => {
    try {
        return JSON.parse(templateJson) as Record<string, unknown>;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Compiled inline template produced invalid JSON: ${message}`,
        });
    }
};
