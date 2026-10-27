import type { DidWebNetworkLearnCardFromSeed } from '@learncard/init';
import { UnsignedVCValidator } from '@learncard/types';
import { db, type ExternalArtifact, type ExternalArtifactDeletion } from '../db';
import { LEARNCARD_NETWORK_URL } from '../constants/env';
import { getLearnCard } from './index';

type DeletionResult = Omit<ExternalArtifactDeletion, 'attemptedAt'>;

const errorDetails = (error: unknown): { code?: string; message?: string } => {
    if (!error || typeof error !== 'object') return {};
    const data = 'data' in error ? error.data : undefined;
    const code =
        data && typeof data === 'object' && 'code' in data
            ? data.code
            : 'code' in error
              ? error.code
              : undefined;
    return {
        code: typeof code === 'string' ? code : undefined,
        message:
            'message' in error && typeof error.message === 'string' ? error.message : undefined,
    };
};

const deletionFailure = (error: unknown): DeletionResult => {
    const { code, message } = errorDetails(error);
    if (code === 'FORBIDDEN' && message === 'Cannot delete boost with children') {
        return { status: 'blocked', code: 'remote_children_remaining' };
    }
    if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
        return { status: 'blocked', code: 'remote_permission_denied' };
    }
    if (code === 'NOT_FOUND') {
        // LCN deletes the graph node and storage cache in Promise.all. A missing
        // node after a lost/failed response does NOT prove the cached payload gone.
        return { status: 'unknown', code: 'remote_absence_unconfirmed' };
    }
    if (code === 'BAD_REQUEST' || code === 'METHOD_NOT_SUPPORTED') {
        return { status: 'blocked', code: 'remote_request_unsupported' };
    }
    return { status: 'retryable', code: 'remote_delete_unconfirmed' };
};

/** The pinned delete SDK uses its configured server, not the URI's server. */
const uriKind = (uri: string): 'credential' | 'boost' | undefined => {
    const match = /^lc:network:([^\s?#]+\/trpc):(credential|boost):([^\s:/?#]+)$/.exec(uri);
    if (!match) return undefined;
    const network = new URL(LEARNCARD_NETWORK_URL);
    const expectedDomain = `${network.host}${network.pathname.replace(/\/$/, '')}`;
    if (match[1]?.replace(/%3a/gi, ':') !== expectedDomain) return undefined;
    return match[2] === 'credential' ? 'credential' : 'boost';
};

/** Best effort only: never equate a lost creation/deletion response with erasure. */
export const cleanupExternalArtifacts = async (
    did: string
): Promise<{
    complete: boolean;
    retryable: boolean;
    artifacts: ExternalArtifact[];
}> => {
    const artifacts = await db.getExternalArtifacts(did);
    let learnCard: DidWebNetworkLearnCardFromSeed['returnValue'] | undefined;
    const record = async (artifact: ExternalArtifact, result: DeletionResult) => {
        const deletion = { ...result, attemptedAt: new Date().toISOString() };
        // Persist before reporting; errors must leave the account cleanup incomplete.
        await db.recordExternalArtifactDeletion(did, artifact.operationId, deletion);
        artifact.deletion = deletion;
    };
    const attempt = async (artifact: ExternalArtifact): Promise<boolean> => {
        if (artifact.deletion?.status === 'deleted') return false;
        if (artifact.status === 'failed' && artifact.uris.length === 0) {
            await record(artifact, {
                status: 'deleted',
                code: 'creation_not_started',
            });
            return true;
        }
        if (artifact.uris.length === 0 || artifact.status === 'reserved') {
            await record(artifact, {
                status: 'unknown',
                code: 'remote_creation_unresolved',
            });
            return false;
        }
        const expected =
            artifact.kind === 'contract-credential'
                ? 'credential'
                : artifact.kind === 'boost' || artifact.kind === 'child-boost'
                  ? 'boost'
                  : undefined;
        if (!expected || artifact.uris.some(uri => uriKind(uri) !== expected)) {
            await record(artifact, {
                status: 'unknown',
                code: 'remote_reference_unsupported',
            });
            return false;
        }
        let result: DeletionResult = { status: 'deleted' };
        for (const uri of new Set(artifact.uris)) {
            try {
                learnCard ??= await getLearnCard();
                if (artifact.status !== 'complete') {
                    // Legacy topic references may point at reused boosts. A URI and this
                    // service's admin rights alone do not authorize deleting someone
                    // else's content. Establish exclusive subject + service attribution.
                    let payload: unknown;
                    try {
                        payload =
                            expected === 'boost'
                                ? (await learnCard.invoke.getBoost(uri)).boost
                                : await learnCard.read.get(uri);
                    } catch {
                        result = {
                            status: 'unknown',
                            code: 'remote_ownership_unconfirmed',
                        };
                        break;
                    }
                    const parsed = UnsignedVCValidator.safeParse(payload);
                    if (!parsed.success) {
                        result = {
                            status: 'unknown',
                            code: 'remote_ownership_unconfirmed',
                        };
                        break;
                    }
                    const issuer =
                        typeof parsed.data.issuer === 'string'
                            ? parsed.data.issuer
                            : parsed.data.issuer.id;
                    const subjects = Array.isArray(parsed.data.credentialSubject)
                        ? parsed.data.credentialSubject
                        : [parsed.data.credentialSubject];
                    if (
                        issuer !== learnCard.id.did() ||
                        subjects.length === 0 ||
                        subjects.some(subject => subject.id !== did)
                    ) {
                        result = {
                            status: 'unknown',
                            code: 'remote_ownership_unconfirmed',
                        };
                        break;
                    }
                }
                const deleted =
                    expected === 'credential'
                        ? await learnCard.invoke.deleteCredential(uri)
                        : await learnCard.invoke.deleteBoost(uri);
                if (deleted !== true) {
                    result = { status: 'unknown', code: 'remote_delete_unconfirmed' };
                    break;
                }
            } catch (error) {
                result = deletionFailure(error);
                break;
            }
        }
        await record(artifact, result);
        return result.status === 'deleted';
    };

    // Credential ownership belongs to the sender. Remove instances first, then
    // newest children before roots. Old inventories need not contain hierarchy.
    const ordered = [...artifacts].sort((a, b) => {
        const rank = (entry: ExternalArtifact) =>
            entry.kind === 'contract-credential' ? 0 : entry.kind === 'child-boost' ? 1 : 2;
        return rank(a) - rank(b) || b.reservedAt.localeCompare(a.reservedAt);
    });
    let progress = false;
    for (const artifact of ordered) progress = (await attempt(artifact)) || progress;
    // A child of a child may precede its descendant in a legacy inventory. Retry
    // only hierarchy blocks while deletions make progress; never loop on errors.
    while (progress) {
        progress = false;
        for (const artifact of ordered) {
            if (artifact.deletion?.code === 'remote_children_remaining') {
                progress = (await attempt(artifact)) || progress;
            }
        }
    }
    return {
        // Acknowledged known-URI deletion is durable/idempotent, but cannot repair
        // incomplete historical creation coverage.
        complete: artifacts.every(
            artifact =>
                artifact.deletion?.status === 'deleted' &&
                (artifact.status === 'complete' ||
                    (artifact.status === 'failed' && artifact.uris.length === 0))
        ),
        retryable: artifacts.some(artifact => artifact.deletion?.status === 'retryable'),
        artifacts,
    };
};
