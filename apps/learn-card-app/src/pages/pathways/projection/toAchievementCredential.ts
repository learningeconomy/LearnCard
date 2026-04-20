/**
 * Projection: PathwayNode → Open Badges 3.0 `AchievementCredential`.
 *
 * Docs § 3.6:
 *
 * > "A node does NOT store a VC; it stores a projection used at issuance.
 * >  Any credential format that can express an achievement + evidence +
 * >  alignment + endorsement is a projection target."
 *
 * This module is the projection target. It is a pure function — no
 * network, no issuance, no DID resolution — so it is trivially testable
 * and survives a swap of the underlying issuer.
 *
 * The real `SIGN` step happens in the brain-service via LearnCard SDK
 * (or the snap in native). This module only produces the unsigned
 * claim object.
 */

import type {
    AchievementProjection,
    EndorsementRef,
    Evidence,
    PathwayNode,
} from '../types';

// -----------------------------------------------------------------
// OBv3 minimal shape
// -----------------------------------------------------------------
//
// We do NOT import from `@digitalcredentials/*` here to keep the core
// projection module dependency-free. The shape below is the subset we
// actually produce. The sign step in brain-service will layer on
// `proof`, `issuer.id`, and DID-specific fields.

export interface AchievementCredentialClaim {
    '@context': readonly string[];
    type: readonly string[];
    id?: string;
    issuanceDate: string;
    credentialSubject: {
        id: string; // learner DID
        type: 'AchievementSubject';
        achievement: {
            id?: string;
            type: readonly string[];
            achievementType: string;
            name: string;
            description?: string;
            criteria: { narrative: string };
            image?: { id: string; type: 'Image' };
            alignment?: Array<{
                type: readonly string[];
                targetName: string;
                targetUrl?: string;
                targetFramework?: string;
                targetCode?: string;
            }>;
        };
        /** Evidence is attached at the subject level per OBv3. */
        evidence?: Array<{
            id: string;
            type: readonly string[];
            narrative?: string;
            genre?: string;
        }>;
        /** Endorsements are projected as inline EndorsementCredential refs. */
        endorsement?: Array<{
            id: string;
            type: readonly string[];
            issuer: string;
        }>;
    };
}

const OBV3_CONTEXT = [
    'https://www.w3.org/2018/credentials/v1',
    'https://purl.imsglobal.org/spec/ob/v3p0/context.json',
] as const;

// -----------------------------------------------------------------
// Projection
// -----------------------------------------------------------------

export class ProjectionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProjectionError';
    }
}

export interface ProjectionInput {
    node: PathwayNode;
    ownerDid: string;
    now: string;
}

/**
 * Project a completed PathwayNode into an unsigned
 * `AchievementCredential` claim.
 *
 * Throws `ProjectionError` if the node has no `credentialProjection`
 * (some nodes — practice ladders, intermediate scaffolding — intentionally
 * do not project; trying to project them is a programmer error, not a
 * user error).
 */
export const toAchievementCredential = ({
    node,
    ownerDid,
    now,
}: ProjectionInput): AchievementCredentialClaim => {
    if (!node.credentialProjection) {
        throw new ProjectionError(
            `Node ${node.id} has no credentialProjection; cannot project.`,
        );
    }

    const projection: AchievementProjection = node.credentialProjection;

    const achievement: AchievementCredentialClaim['credentialSubject']['achievement'] = {
        type: ['Achievement'] as const,
        achievementType: projection.achievementType,
        name: node.title,
        description: node.description,
        criteria: { narrative: projection.criteria },
    };

    if (projection.image) {
        achievement.image = { id: projection.image, type: 'Image' };
    }

    if (projection.alignment && projection.alignment.length > 0) {
        achievement.alignment = projection.alignment.map(a => ({
            type: ['Alignment'] as const,
            targetName: a.targetName,
            targetUrl: a.targetUrl,
            targetFramework: a.targetFramework,
            targetCode: a.targetCode,
        }));
    }

    const claim: AchievementCredentialClaim = {
        '@context': OBV3_CONTEXT,
        type: ['VerifiableCredential', 'OpenBadgeCredential', 'AchievementCredential'] as const,
        issuanceDate: now,
        credentialSubject: {
            id: ownerDid,
            type: 'AchievementSubject',
            achievement,
        },
    };

    if (node.progress.artifacts.length > 0) {
        claim.credentialSubject.evidence = node.progress.artifacts.map(e => ({
            id: e.id,
            type: ['Evidence'] as const,
            narrative: e.note,
            genre: e.artifactType,
        }));
    }

    if (node.endorsements.length > 0) {
        claim.credentialSubject.endorsement = node.endorsements.map(e => ({
            id: e.endorsementId,
            type: ['EndorsementCredential'] as const,
            issuer: e.endorserDid,
        }));
    }

    return claim;
};

/**
 * Can this node be projected? Cheap predicate callers use to decide
 * whether to show the "issue credential" UI at termination time.
 */
export const canProject = (node: PathwayNode): boolean =>
    !!node.credentialProjection && node.progress.status === 'completed';

// Re-exported for tests / debugging without importing from types.
export type { Evidence, EndorsementRef };
