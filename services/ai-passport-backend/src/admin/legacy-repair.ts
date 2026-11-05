import type { WorkflowOperation } from './run-model';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
import { MongoClient, ObjectId } from 'mongodb';
import { randomUUID } from 'node:crypto';
import type { VC } from '@learncard/types';
import { MONGO_URI, MONGO_DB } from '../constants/env';
import { getLearnCard } from '../learncard';
import { db } from '../db';
import { assertCurrentAiConsent, runWithAiPrivacyContext } from '../ai/privacy';
import { withOwnerOperation, isDataErasureRequested } from '../services/dataErasure';
import { AiConsentError } from '../learncard/consent';
import { verifyCredentialForIngestion } from '../credentials/verification';
import { projectCredential } from '../credentials/projection';
import type { RepairOutcome } from './legacy-repair-model';
import { repairSourceFingerprint, REPAIR_SOURCE_PROJECTION } from './legacy-repair-source';

type Source = Record<string, any> & { _id: ObjectId };
type RepairJob = {
    _id: string;
    cursor: string;
    highWater: string;
    scanned: number;
    repaired: number;
    state: 'paused' | 'completed';
    outcomes: Partial<Record<RepairOutcome, number>>;
    candidate?: string;
    fingerprint?: string;
    revision?: string;
    lease?: string;
    leaseUntil?: Date;
};
let mongo: MongoClient | undefined;
async function database() {
    mongo ??= new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 2000,
        socketTimeoutMS: 5000,
    });
    await mongo.connect();
    return mongo.db(MONGO_DB);
}
const publicJob = (job: RepairJob) => ({
    _id: job._id,
    scanned: job.scanned,
    repaired: job.repaired,
    state: job.state,
    outcomes: job.outcomes,
    awaitingVerification: Boolean(job.candidate),
});
export async function listRepairJobs() {
    const rows = await (
        await database()
    )
        .collection<RepairJob>('embedding_legacy_repair_jobs')
        .find({})
        .sort({ _id: -1 })
        .limit(20)
        .toArray();
    return rows.map(publicJob);
}
export async function createRepairJob(id: string, continuationOf?: string) {
    const store = (await database()).collection<RepairJob>('embedding_legacy_repair_jobs');
    const prior = await store.findOne({ _id: id });
    if (prior) return publicJob(prior);
    const previous = continuationOf
        ? await store.findOne({ _id: continuationOf, state: 'completed' })
        : null;
    if (continuationOf && !previous) throw new Error('Completed repair range required');
    const last = await (
        await database()
    )
        .collection('credentials')
        .find({}, { projection: { _id: 1 } })
        .sort({ _id: -1 })
        .limit(1)
        .next();
    const job: RepairJob = {
        _id: id,
        cursor: previous?.cursor ?? '',
        highWater: previous?.highWater ?? (last ? String(last._id) : ''),
        scanned: 0,
        repaired: 0,
        state: 'paused',
        outcomes: {},
    };
    await store.insertOne(job);
    return publicJob(job);
}
const checkSignal = (signal: AbortSignal) => signal.throwIfAborted();
async function bounded<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
    checkSignal(signal);
    let listener: () => void = () => {};
    try {
        return await Promise.race([
            promise,
            new Promise<never>((_, reject) => {
                listener = () => reject(new Error('Operation interrupted'));
                signal.addEventListener('abort', listener, { once: true });
                if (signal.aborted) listener();
            }),
        ]);
    } finally {
        signal.removeEventListener('abort', listener);
    }
}
export async function inspectLegacySource(
    source: Source,
    apply: boolean,
    expected?: { fingerprint: string; revision: string },
    assertLease: () => Promise<void> = async () => {},
    operation?: { jobId: string; lease: string } | WorkflowOperation
): Promise<{ outcome: RepairOutcome; revision?: string }> {
    if (typeof source.did !== 'string' || !source.did.startsWith('did:'))
        return { outcome: 'missing_owner' };
    if (source.source === 'generated' || source.category === AI_INSIGHT_CREDENTIAL_TYPE)
        return { outcome: 'generated' };
    if (source.verification) return { outcome: 'already_verified' };
    if (typeof source.uri !== 'string' || !source.uri.trim()) return { outcome: 'missing_uri' };
    if (apply && !expected) return { outcome: 'source_changed' };
    if (expected && repairSourceFingerprint(source) !== expected.fingerprint)
        return { outcome: 'source_changed' };
    try {
        return await withOwnerOperation(source.did, ownerSignal =>
            runWithAiPrivacyContext(source.did, async () => {
                const signal = AbortSignal.any([ownerSignal, AbortSignal.timeout(30000)]);
                const receipt = await bounded(
                    assertCurrentAiConsent('credential-ingestion'),
                    signal
                );
                if (!receipt.credentialUris.includes(source.uri))
                    return { outcome: 'unshared' as const };
                if (expected && receipt.revision !== expected.revision)
                    return { outcome: 'source_changed' as const };
                if (!apply) return { outcome: 'eligible' as const, revision: receipt.revision };
                const learnCard = await bounded(getLearnCard(), signal);
                let original: VC;
                try {
                    await assertLease();
                    original = await bounded(learnCard.read.get(source.uri) as Promise<VC>, signal);
                } catch {
                    return { outcome: 'original_unavailable' as const };
                }
                if (!original) return { outcome: 'original_unavailable' as const };
                let invalidKind: RepairOutcome = 'credential_invalid';
                let verification;
                try {
                    verification = await bounded(
                        verifyCredentialForIngestion(
                            {
                                credential: original,
                                credentialUri: source.uri,
                                subjectDid: source.did,
                                consent: receipt,
                                verify: async credential => {
                                    await assertLease();
                                    const result = await bounded(
                                        learnCard.invoke.verifyCredential(credential),
                                        signal
                                    );
                                    const errors = (result as { errors?: unknown }).errors;
                                    if (Array.isArray(errors)) {
                                        if (
                                            errors.some(
                                                error =>
                                                    error === 'Credential is revoked.' ||
                                                    error === 'Credential is suspended.'
                                            )
                                        )
                                            invalidKind = 'credential_revoked';
                                        else if (
                                            // Only a pure expiry/validity outcome is reported as
                                            // expired; with any other failure it stays invalid.
                                            errors.some(
                                                error =>
                                                    typeof error === 'string' &&
                                                    error.startsWith('expiration error: ')
                                            ) &&
                                            errors.every(
                                                error =>
                                                    error ===
                                                        'expiration error: Credential is expired' ||
                                                    error ===
                                                        'expiration error: Credential is not valid yet' ||
                                                    error ===
                                                        'expiration error: Credential is no longer valid' ||
                                                    error ===
                                                        'Boost Credential could not be verified.'
                                            )
                                        )
                                            invalidKind = 'credential_expired';
                                    }
                                    return result;
                                },
                            },
                            false
                        ),
                        signal
                    );
                } catch {
                    return { outcome: 'verification_unavailable' as const };
                }
                if (verification.status !== 'valid')
                    return {
                        outcome: verification.errors.includes('credential_subject_mismatch')
                            ? ('subject_mismatch' as const)
                            : invalidKind,
                    };
                const projection = projectCredential(
                    original,
                    typeof source.category === 'string'
                        ? source.category
                        : 'Uncategorized Credential',
                    verification
                );
                const recheck = async () => {
                    checkSignal(signal);
                    await assertLease();
                    const fresh = await bounded(
                        assertCurrentAiConsent('credential-ingestion'),
                        signal
                    );
                    if (
                        fresh.revision !== receipt.revision ||
                        !fresh.credentialUris.includes(source.uri)
                    )
                        throw new AiConsentError('Consent changed during repair');
                    checkSignal(signal);
                };
                await recheck();
                const committed = await db.commitLegacyVerification(
                    source.did,
                    source._id,
                    repairSourceFingerprint(source),
                    verification,
                    projection,
                    recheck,
                    operation!
                );
                return {
                    outcome: committed ? ('repaired' as const) : ('source_changed' as const),
                };
            })
        );
    } catch (error) {
        if (error instanceof AiConsentError)
            return {
                outcome: (
                    {
                        missing: 'consent_missing',
                        revoked: 'consent_revoked',
                        expired: 'consent_expired',
                        guardian_required: 'guardian_required',
                        unavailable: 'consent_unavailable',
                    } as const
                )[error.reason ?? 'unavailable'],
            };
        if (
            error instanceof Error &&
            error.name === 'DataErasureRequestedError' &&
            (await isDataErasureRequested(source.did))
        )
            return { outcome: 'owner_erased' };
        return { outcome: 'unavailable' };
    }
}
export async function repairJobAction(
    id: string,
    apply: boolean,
    externalGuard: () => Promise<void> = async () => {},
    batchId?: string
) {
    const databaseInstance = await database();
    const store = databaseInstance.collection<RepairJob>('embedding_legacy_repair_jobs');
    const lease = randomUUID();
    const job = await store.findOneAndUpdate(
        {
            _id: id,
            state: 'paused',
            ...(batchId ? { batchId } : { batchId: { $exists: false } }),
            $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lte: new Date() } }],
        },
        { $set: { lease, leaseUntil: new Date(Date.now() + 60000) } },
        { returnDocument: 'after' }
    );
    if (!job) throw new Error('Repair unavailable or already active');
    try {
        await externalGuard();
        if (apply && !job.candidate) throw new Error('Preview required');
        const source = job.candidate
            ? await databaseInstance
                  .collection<Source>('credentials')
                  .findOne(
                      { _id: new ObjectId(job.candidate) },
                      { projection: REPAIR_SOURCE_PROJECTION }
                  )
            : job.highWater
              ? await databaseInstance.collection<Source>('credentials').findOne(
                    {
                        verification: null,
                        _id: {
                            ...(job.cursor ? { $gt: new ObjectId(job.cursor) } : {}),
                            $lte: new ObjectId(job.highWater),
                        },
                    },
                    { sort: { _id: 1 }, projection: REPAIR_SOURCE_PROJECTION }
                )
              : null;
        if (!source) {
            if (job.candidate) {
                job.outcomes.source_changed = (job.outcomes.source_changed ?? 0) + 1;
                job.scanned += 1;
                job.cursor = job.candidate;
            } else job.state = 'completed';
            delete job.candidate;
            delete job.fingerprint;
            delete job.revision;
        } else {
            const result = await inspectLegacySource(
                source,
                apply,
                apply ? { fingerprint: job.fingerprint!, revision: job.revision! } : undefined,
                async () => {
                    await externalGuard();
                    if (
                        !(await store.findOne(
                            { _id: id, lease, leaseUntil: { $gt: new Date() } },
                            { projection: { _id: 1 } }
                        ))
                    )
                        throw new Error('Repair lease expired');
                },
                { jobId: id, lease }
            );
            if (!apply && result.outcome === 'eligible') {
                job.candidate = String(source._id);
                job.fingerprint = repairSourceFingerprint(source);
                job.revision = result.revision;
            } else {
                job.outcomes[result.outcome] = (job.outcomes[result.outcome] ?? 0) + 1;
                if (result.outcome === 'repaired') job.repaired += 1;
                const retryable = [
                    'source_changed',
                    'unavailable',
                    'original_unavailable',
                    'verification_unavailable',
                    'consent_unavailable',
                ].includes(result.outcome);
                if (!retryable) {
                    job.scanned += 1;
                    job.cursor = String(source._id);
                }
                delete job.candidate;
                delete job.fingerprint;
                delete job.revision;
                if (job.scanned >= 100) job.state = 'completed';
            }
        }
        if (job.scanned >= 100) job.state = 'completed';
        const { lease: _, leaseUntil: __, ...saved } = job;
        const checkpoint = await store.updateOne(
            { _id: id, lease, leaseUntil: { $gt: new Date() } },
            {
                $set: saved,
                $unset: {
                    lease: '',
                    leaseUntil: '',
                    ...(!job.candidate ? { candidate: '', fingerprint: '', revision: '' } : {}),
                },
            }
        );
        if (checkpoint.matchedCount !== 1) throw new Error('Repair lease expired');
        return publicJob(job);
    } catch {
        await store.updateOne({ _id: id, lease }, { $unset: { lease: '', leaseUntil: '' } });
        throw new Error('Repair unavailable; preview and retry explicitly');
    }
}

async function readGeneratedOriginalFromLearnCard(
    learnCard: Awaited<ReturnType<typeof getLearnCard>>,
    source: Source,
    operation: WorkflowOperation,
    assertLease: () => Promise<void>,
    signal: AbortSignal
): Promise<VC | null> {
    // Re-establish that this exact source and planned hash are still current
    // before any LearnCard read; a changed source never reaches the network.
    if (
        !(await bounded(
            db.confirmWorkflowGeneratedSource(
                source.did,
                source._id as ObjectId,
                operation.initialFingerprint,
                operation.originalHash!,
                operation
            ),
            signal
        ))
    )
        return null;
    try {
        await assertLease();
        return (
            (await bounded(
                learnCard.read.get(source.uri as string) as Promise<VC | undefined>,
                signal
            )) ?? null
        );
    } catch {
        return null;
    }
}

/** Migrate one historical signed insight. Never issue a replacement insight. */
export async function inspectWorkflowGeneratedSource(
    source: Source,
    operation: WorkflowOperation,
    assertLease: () => Promise<void>
): Promise<{ outcome: RepairOutcome }> {
    if (typeof source.did !== 'string' || !source.did.startsWith('did:'))
        return { outcome: 'missing_owner' };
    if (typeof source.uri !== 'string' || !source.uri) return { outcome: 'missing_uri' };
    if (!operation.originalHash) return { outcome: 'generated_original_unavailable' };
    if (source.verification) return { outcome: 'already_verified' };
    try {
        return await withOwnerOperation(source.did, ownerSignal =>
            runWithAiPrivacyContext(source.did, async () => {
                const signal = AbortSignal.any([ownerSignal, AbortSignal.timeout(30000)]);
                await assertLease();
                const receipt = await bounded(assertCurrentAiConsent('embedding'), signal);
                let original: VC | null;
                try {
                    original = await bounded(
                        db.getWorkflowRetainedOriginal(
                            source.did,
                            source._id,
                            operation.initialFingerprint,
                            operation.originalHash!,
                            operation
                        ),
                        signal
                    );
                } catch {
                    return { outcome: 'generated_original_integrity' as const };
                }
                const learnCard = await bounded(getLearnCard(), signal);
                // The retained raw copy expired or was never kept: read the original
                // insight back from LearnCard by URI. It must still hash to the planned
                // originalHash, pass the issuer/type/consent/proof checks below, and is
                // never reissued.
                const fromLearnCard = !original;
                if (!original)
                    original = await readGeneratedOriginalFromLearnCard(
                        learnCard,
                        source,
                        operation,
                        assertLease,
                        signal
                    );
                if (!original) return { outcome: 'generated_original_unavailable' as const };
                const issuer =
                    typeof original.issuer === 'string' ? original.issuer : original.issuer?.id;
                if (!issuer || issuer !== learnCard.id.did())
                    return { outcome: 'generated_issuer_mismatch' as const };
                if (
                    !Array.isArray(original.type) ||
                    !original.type.includes(AI_INSIGHT_CREDENTIAL_TYPE)
                )
                    return { outcome: 'generated_type_mismatch' as const };
                const directlyGranted = receipt.credentialUris.includes(source.uri);
                const sibling = await db.getCredentialVerification(source.did, source.uri);
                const { CredentialVerificationMetadataValidator } =
                    await import('@learncard/types');
                const parsed = CredentialVerificationMetadataValidator.safeParse(sibling);
                const retained =
                    parsed.success &&
                    parsed.data.credentialUri === source.uri &&
                    parsed.data.contentHash === operation.originalHash &&
                    parsed.data.provenance.source === 'generated' &&
                    parsed.data.status === 'valid' &&
                    parsed.data.checks.includes('proof') &&
                    parsed.data.errors.length === 0 &&
                    parsed.data.consent.revision === receipt.revision;
                if (!directlyGranted && !retained)
                    return {
                        outcome: sibling
                            ? ('generated_consent_evidence_changed' as const)
                            : ('generated_consent_evidence_missing' as const),
                    };
                const verification = await bounded(
                    verifyCredentialForIngestion(
                        {
                            credential: original,
                            credentialUri: source.uri,
                            subjectDid: source.did,
                            consent: receipt,
                            verify: async credential => {
                                await assertLease();
                                return bounded(
                                    learnCard.invoke.verifyCredential(credential),
                                    signal
                                );
                            },
                        },
                        false
                    ),
                    signal
                );
                if (verification.status !== 'valid')
                    return {
                        outcome: verification.errors.includes('credential_subject_mismatch')
                            ? ('subject_mismatch' as const)
                            : ('credential_invalid' as const),
                    };
                if (verification.contentHash !== operation.originalHash)
                    return { outcome: 'generated_original_integrity' as const };
                verification.provenance.source = 'generated';
                const projection = projectCredential(
                    original,
                    AI_INSIGHT_CREDENTIAL_TYPE,
                    verification
                );
                const recheck = async () => {
                    checkSignal(signal);
                    await assertLease();
                    const current = await bounded(assertCurrentAiConsent('embedding'), signal);
                    if (
                        current.revision !== receipt.revision ||
                        (directlyGranted && !current.credentialUris.includes(source.uri))
                    )
                        throw new AiConsentError('Generated consent changed during repair');
                    // Called again inside the source/item transaction. The retained
                    // original and sibling receipt must still support this same source.
                    let retainedOriginal;
                    try {
                        retainedOriginal = fromLearnCard
                            ? await bounded(
                                  db.confirmWorkflowGeneratedSource(
                                      source.did,
                                      source._id,
                                      operation.initialFingerprint,
                                      operation.originalHash!,
                                      operation
                                  ),
                                  signal
                              )
                            : await bounded(
                                  db.getWorkflowRetainedOriginal(
                                      source.did,
                                      source._id,
                                      operation.initialFingerprint,
                                      operation.originalHash!,
                                      operation
                                  ),
                                  signal
                              );
                    } catch {
                        throw new Error('generated_original_integrity');
                    }
                    if (!retainedOriginal) throw new Error('generated_original_unavailable');
                    if (!directlyGranted) {
                        const freshEvidence = CredentialVerificationMetadataValidator.safeParse(
                            await db.getCredentialVerification(source.did, source.uri)
                        );
                        if (
                            !freshEvidence.success ||
                            freshEvidence.data.credentialUri !== source.uri ||
                            freshEvidence.data.contentHash !== operation.originalHash ||
                            freshEvidence.data.provenance.source !== 'generated' ||
                            freshEvidence.data.status !== 'valid' ||
                            !freshEvidence.data.checks.includes('proof') ||
                            freshEvidence.data.errors.length ||
                            freshEvidence.data.consent.revision !== current.revision
                        )
                            throw new Error('generated_consent_evidence_changed');
                    }
                };
                await recheck();
                // This claim is a checkpoint, not authorization by itself. The source
                // commit rechecks the run lease, original hash, owner and initial snapshot.
                const store = (await database()).collection('embedding_backfill_items');
                const claimed = await store.updateOne(
                    {
                        _id: `${operation.runId}:${operation.index}`,
                        runId: operation.runId,
                        state: 'pending',
                        initialFingerprint: operation.initialFingerprint,
                        originalHash: operation.originalHash,
                    } as never,
                    {
                        $set: {
                            repairFingerprint: repairSourceFingerprint(source),
                            revision: receipt.revision,
                        },
                    }
                );
                if (claimed.matchedCount !== 1) return { outcome: 'source_changed' as const };
                const committed = await db.commitLegacyVerification(
                    source.did,
                    source._id,
                    repairSourceFingerprint(source),
                    verification,
                    projection,
                    recheck,
                    operation
                );
                return { outcome: committed ? ('repaired' as const) : ('source_changed' as const) };
            })
        );
    } catch (error) {
        if (
            error instanceof Error &&
            [
                'generated_original_integrity',
                'generated_original_unavailable',
                'generated_consent_evidence_changed',
            ].includes(error.message)
        )
            return { outcome: error.message as RepairOutcome };
        if (error instanceof AiConsentError)
            return {
                outcome: (
                    {
                        missing: 'consent_missing',
                        revoked: 'consent_revoked',
                        expired: 'consent_expired',
                        guardian_required: 'guardian_required',
                        unavailable: 'consent_unavailable',
                    } as const
                )[error.reason ?? 'unavailable'],
            };
        if (
            error instanceof Error &&
            error.name === 'DataErasureRequestedError' &&
            (await isDataErasureRequested(source.did))
        )
            return { outcome: 'owner_erased' };
        return { outcome: 'verification_unavailable' };
    }
}
