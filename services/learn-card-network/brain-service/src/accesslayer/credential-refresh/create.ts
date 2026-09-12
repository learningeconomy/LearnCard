import crypto from 'crypto';

import { neogma } from '@instance';
import { Profile, Credential } from '@models';
import {
    CreateCredentialRefreshParams,
    CreateCredentialRefreshParamsValidator,
    CredentialRefreshRecord,
    CredentialRefreshRecordValidator,
} from 'types/credential-refresh';

const REFRESH_ID_BYTES = 32;

/**
 * Generates a cryptographically random, unguessable public route identifier for a
 * managed refresh aggregate (32 bytes of secure randomness, base64url encoded).
 */
export const generateRefreshId = (): string =>
    crypto.randomBytes(REFRESH_ID_BYTES).toString('base64url');

/**
 * Creates a managed credential refresh aggregate bound to its issuer, intended
 * holder, and the original immutable credential node. The aggregate starts in
 * `awaiting_claim` with ROOT and HEAD both pointing at the original (version 1).
 *
 * The aggregate and version payloads persist metadata only — credential content is
 * stored solely as holder-encrypted JWE JSON on immutable Credential nodes.
 */
export const createCredentialRefresh = async (
    params: CreateCredentialRefreshParams
): Promise<CredentialRefreshRecord> => {
    const validated = CreateCredentialRefreshParamsValidator.parse(params);

    const refreshId = generateRefreshId();
    const now = new Date().toISOString();

    // Issuer/holder relationships are required: fail before writing anything when the
    // referenced profiles or root credential node do not exist.
    const issuer = await Profile.findOne({ where: { profileId: validated.issuerProfileId } });

    if (!issuer) {
        throw new Error(
            `Cannot create credential refresh: issuer profile ${validated.issuerProfileId} not found`
        );
    }

    if (validated.holderProfileId) {
        const holder = await Profile.findOne({ where: { profileId: validated.holderProfileId } });

        if (!holder) {
            throw new Error(
                `Cannot create credential refresh: holder profile ${validated.holderProfileId} not found`
            );
        }
    }

    const root = await Credential.findOne({ where: { id: validated.rootCredentialNodeId } });

    if (!root) {
        throw new Error(
            `Cannot create credential refresh: root credential node ${validated.rootCredentialNodeId} not found`
        );
    }

    // Neo4j parameters cannot contain undefined — strip absent optional fields
    const props = Object.fromEntries(
        Object.entries({
            refreshId,
            issuerProfileId: validated.issuerProfileId,
            issuerDid: validated.issuerDid,
            holderProfileId: validated.holderProfileId,
            holderDid: validated.holderDid,
            credentialId: validated.credentialId,
            state: 'awaiting_claim',
            currentVersion: 1,
            etag: validated.etag,
            materialDigest: validated.materialDigest,
            signingMode: validated.signingMode,
            idempotencyKey: validated.idempotencyKey,
            updateSummary: validated.updateSummary,
            lastPublishedAt: now,
            createdAt: now,
            updatedAt: now,
        }).filter(([, value]) => value !== undefined)
    );

    // Tag the root node as version 1 of this aggregate so history queries and the
    // per-aggregate version uniqueness constraint cover the whole chain.
    await neogma.queryRunner.run(
        `MATCH (issuer:Profile {profileId: $issuerProfileId})
         MATCH (root:Credential {id: $rootCredentialNodeId})
         CREATE (refresh:CredentialRefresh $props)
         CREATE (issuer)-[:ISSUED_REFRESH]->(refresh)
         CREATE (refresh)-[:ROOT]->(root)
         CREATE (refresh)-[:HEAD]->(root)
         WITH refresh, root
         SET root.refreshId = $refreshId,
             root.version = 1,
             root.refreshVersionKey = $versionKey,
             root.publishedAt = $now,
             root.signingMode = coalesce($signingMode, root.signingMode)
         RETURN refresh`,
        {
            issuerProfileId: validated.issuerProfileId,
            rootCredentialNodeId: validated.rootCredentialNodeId,
            props,
            refreshId,
            versionKey: `${refreshId}:1`,
            signingMode: validated.signingMode ?? null,
            now,
        }
    );

    if (validated.holderProfileId) {
        await neogma.queryRunner.run(
            `MATCH (holder:Profile {profileId: $holderProfileId})
             MATCH (refresh:CredentialRefresh {refreshId: $refreshId})
             CREATE (holder)-[:HELD_REFRESH]->(refresh)`,
            { holderProfileId: validated.holderProfileId, refreshId }
        );
    }

    return CredentialRefreshRecordValidator.parse({
        ...props,
        holderProfileId: validated.holderProfileId,
    });
};
