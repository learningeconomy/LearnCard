import { getBedrockGenerationModelForAudit } from '../ai/bedrock-generation';
import { logSafeEvent } from '../logging';
import { settleAll } from '../utils/settleAll';
import {
    forgetVerifiedCredential,
    getVerifiedCredential,
    isCredentialItemFailure,
    knownBadCredentialKind,
    logCredentialBatch,
    logCredentialSkip,
    markCredentialItemFailure,
    markCredentialReadFailure,
    isCredentialReadFailure,
    recordCredentialOutcome,
    rememberVerifiedCredential,
    settleCredentialBatch,
    waitForCredentialContextIdle,
} from './batch';
import {
    boundLearnCardCall,
    getLearnCardRequestSignal,
    learnCardStoresDeferred,
    oncePerLearnCardRequest,
    runWithLearnCardRequestScope,
} from '../learncard/requestScope';
import { deferCredentialStore } from './store-queue';
import {
    withAiInsightStage,
    withAiInsightResolutionOperation,
    withAiInsightTiming,
} from '../diagnostics/ai-insight';
import type { DBCredentialRecord } from '../db';
import { getLearnCard } from '../learncard';
import { db } from '../db';
import { isRetryableSourceCleanupError } from '../db/source-cleanup';

import { aiCall, generateCredentialEmbeddingTexts } from '../ai';
import { classifyFileContent } from '../helpers/file.helpers';
import {
    getSuggestedTopics as _getSuggestedTopics,
    warmUpTopicsCache as _warmUpTopicsCache,
} from '../ai/topics';

import { generateAndStoreCredentialEmbeddings } from '../ai/embeddings';
import { UnrecoverableError } from 'bullmq';
import type { Job } from 'bullmq';
import { UnsignedClrCredentialValidator } from '@learncard/types';
import type {
    CredentialVerificationMetadata,
    ModelSafeCredentialProjection,
    UnsignedVC,
    VC,
} from '@learncard/types';
import type { CredentialIngestionJobData } from '../workers/types';
import type { CredentialIngestionMetrics } from '../workers/credentialIngestionState';

import { CREDENTIAL_VECTOR_COLLECTION_COUNT, getCredentialVectorCoverage } from '../db/qdrant';
import { generateAIInsightCredential } from '../services/awarding';
import { BoostCategoryOptionsEnum, constructCustomType } from './helpers';
import { extractTextFromBase64File, getAiPromptForFile } from '../helpers/file.helpers';
import { toUnsignedTranscriptClr } from '../helpers/transcript-clr.helpers';
import { FileUploadTypesEnum, ParsedTranscriptSchema } from '../ai/generation-schemas';
import { CREDENTIAL_PRELOAD_CONCURRENCY, FORMATTING_MODEL } from '../constants/env';
import { AI_INSIGHT_CREDENTIAL_TYPE } from '../constants/vc';
import { DataErasureRequestedError } from '../services/dataErasure';
import { isDataErasureRequested, assertOwnerOperationActive } from '../services/dataErasure';
import * as ownerOperations from '../services/dataErasure';

import { Source, Alignment, Evidence } from '../helpers/credential.helpers';

import {
    hasKnownUnsupportedInsightSuite,
    type InsightInputCoverage,
    type InsightInputExclusionReason,
} from './insight-eligibility';
import {
    verifyCredentialForIngestion,
    CredentialVerificationUnavailableError,
    type CredentialConsentReceipt,
} from './verification';
import { classifyLearnCardFailure } from '../learncard/errors';
import { getMcpProgress } from '../diagnostics/mcp-progress';
import { timeMcpStage } from '../diagnostics/mcp-timing';
import { credentialSlowReadMs, credentialUriHash } from './read-budget';
import {
    attachCauseStep,
    attachVerifyFailureDiagnostics,
    copyVerifyFailureDiagnostics,
    sanitizeCauseMessage,
    withCauseStep,
} from './verify-diagnostics';
import {
    projectCredential,
    getCredentialProjection,
    serializeModelSafeCredentialProjection,
} from './projection';
import {
    AiConsentError,
    consentAuthorizationKey,
    getActiveAiConsentReceipt,
    loadActiveAiConsentData,
    type ActiveAiConsentRecord,
    type ActiveAiConsentReceipt,
} from '../learncard/consent';
import {
    getCurrentAiSubject,
    getCurrentAiCredentialUris,
    bindAiConsentRevision,
} from '../ai/privacy';

type ConsentFlowCredentialLocation = {
    uri: string;
    category?: string;
};

type ConsentFlowCredentialRef = ConsentFlowCredentialLocation & {
    consent: CredentialConsentReceipt;
};

type ResolvedConsentFlowCredential = ConsentFlowCredentialRef & {
    credential: VC;
    verification: CredentialVerificationMetadata;
    projection: ModelSafeCredentialProjection;
};

const normalizeMeaningfulString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
};

const dedupeCredentialRefs = <Ref extends ConsentFlowCredentialLocation>(refs: Ref[]): Ref[] => {
    const seen = new Set<string>();
    const deduped: Ref[] = [];

    for (const ref of refs) {
        if (!ref.uri || seen.has(ref.uri)) continue;
        seen.add(ref.uri);
        deduped.push(ref);
    }

    return deduped;
};

const extractCredentialRefs = (
    value: unknown,
    fallbackCategory?: string
): ConsentFlowCredentialLocation[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.flatMap(entry => extractCredentialRefs(entry, fallbackCategory));
    }

    if (typeof value !== 'object') return [];

    const record = value as Record<string, unknown>;
    const category =
        normalizeMeaningfulString(record.category) ??
        normalizeMeaningfulString(record.type) ??
        fallbackCategory;
    const uri = normalizeMeaningfulString(record.uri);

    const refs: ConsentFlowCredentialLocation[] = [];

    if (uri) {
        refs.push({ uri, category });
    }

    if (record.credentials) {
        refs.push(...extractCredentialRefs(record.credentials, category));
    }

    return refs;
};

const extractConsentFlowCredentialRefs = (record: ActiveAiConsentRecord) => {
    const credentialContainer = record.credentials;
    const categoryMap =
        typeof credentialContainer === 'object' &&
        credentialContainer !== null &&
        !Array.isArray(credentialContainer)
            ? (credentialContainer as Record<string, unknown>).categories
            : undefined;

    const refs = [
        ...extractCredentialRefs(credentialContainer),
        ...(categoryMap && typeof categoryMap === 'object' && !Array.isArray(categoryMap)
            ? Object.entries(categoryMap).flatMap(([categoryName, categoryValue]) =>
                  extractCredentialRefs(categoryValue, categoryName)
              )
            : []),
    ];

    const consent = getActiveAiConsentReceipt(record, 'credential-ingestion');

    if (!consent) throw new AiConsentError();

    return dedupeCredentialRefs(refs)
        .filter(ref => consent.credentialUris.includes(ref.uri))
        .map(ref => ({ ...ref, consent }));
};

/**
 * Where each shared credential lives, from one consent read: built once per
 * request so each credential does not rescan every record.
 */
export const consentCredentialLocations = (
    records: readonly ActiveAiConsentRecord[]
): Map<string, ConsentFlowCredentialLocation> => {
    const locations = new Map<string, ConsentFlowCredentialLocation>();
    for (const ref of records.flatMap(record => extractConsentFlowCredentialRefs(record)))
        if (!locations.has(ref.uri))
            locations.set(ref.uri, { uri: ref.uri, category: ref.category });
    return locations;
};

export const storeCredentialEmbeddings = async (
    credential: DBCredentialRecord,
    did: string,
    batchReceipt?: ActiveAiConsentReceipt
): Promise<void> => {
    const consent = credential.verification?.consent;
    if (!consent) throw new UnrecoverableError('Verified credential provenance is required');
    const assertScope = () =>
        batchReceipt
            ? assertCredentialSnapshot(did, credential.uri, batchReceipt)
            : assertCredentialConsent(did, credential.uri, consent);
    if (batchReceipt && batchReceipt.revision !== consent.revision)
        throw new AiConsentError('Credential provenance differs from the batch consent');
    await assertScope();
    const projection = getCredentialProjection(credential);
    const embeddingTexts = await generateCredentialEmbeddingTexts(
        serializeModelSafeCredentialProjection(projection)
    );
    await assertScope();
    // Reindex by deterministic point ID; retain other generations for rollback.
    await generateAndStoreCredentialEmbeddings(credential, embeddingTexts, did);
    await assertScope();
};

async function reconcileDeletedCredentials(did: string, walletUris: string[]): Promise<number> {
    const cleanup = await db.recoverSourceVectorCleanup(did, 32);
    if (cleanup.pendingTasks || cleanup.pendingPoints)
        throw new Error('Source cleanup pending; retry ingestion or bounded admin recovery');
    const walletUriSet = new Set(walletUris);
    const dbVcs = await db.getCredentialRecords(did);

    const staleUris = dbVcs
        .filter(vc => vc.source !== 'generated' && vc.category !== AI_INSIGHT_CREDENTIAL_TYPE)
        .map(vc => vc.uri)
        .filter(uri => !walletUriSet.has(uri));

    if (!staleUris.length) return 0; // check if there are any stale credentials

    const [deletedCount, modifiedThreads] = await Promise.all([
        // Delete stale credentials from DB and threads
        db.deleteVCsByUris(did, staleUris),
        db.removeThreadCredentialsByUris(did, staleUris),
    ]);

    console.log(
        `Reconciled ${staleUris.length} stale credentials for DID ${did}. Deleted from DB: ${deletedCount}. Threads updated: ${modifiedThreads}`
    );

    return staleUris.length;
}

const requireCredentialOwner = (did: string): void => {
    if (getCurrentAiSubject() !== did)
        throw new AiConsentError('Authenticated AI subject mismatch');
};

/** The request's authenticated AI subject owns `did`'s credentials. */
export const assertCredentialScope = (did: string): void => requireCredentialOwner(did);

export const assertCredentialConsent = async (
    did: string,
    uri: string,
    expected: ActiveAiConsentReceipt
): Promise<void> =>
    withAiInsightTiming('consent_check', async () => {
        requireCredentialOwner(did);
        const { receipt } = await loadActiveAiConsentData(
            await withAiInsightResolutionOperation('sdk_init', () => getLearnCard()),
            did,
            expected.purpose,
            { expectedRevision: expected.revision }
        );
        if (
            receipt.revision !== expected.revision ||
            !expected.credentialUris.includes(uri) ||
            !receipt.credentialUris.includes(uri)
        )
            throw new AiConsentError('Credential consent changed');
    });

// Insight inputs share one live contract snapshot. Local guards preserve owner,
// revision and URI membership during reads/queued writes without remote fanout.
/*
 * The owner-operation fence (a Redis script) once per FENCE_REUSE_MS per owner
 * operation, shared by every credential in flight, instead of 4-5 times per
 * credential. The operation's own signal is still checked on every call (the
 * heartbeat aborts it when erasure is requested), and withOwnerOperation runs
 * a live fence before it returns anything, so nothing is published after an
 * erasure request; at most FENCE_REUSE_MS more reads can start.
 */
const FENCE_REUSE_MS = 1_000;
const recentFences = new Map<string, { at: number; check: Promise<void> }>();

const fenceOwnerOperation = (did: string): Promise<void> =>
    timeMcpStage('fence', () => {
        const current =
            typeof ownerOperations.getCurrentOwnerOperation === 'function'
                ? ownerOperations.getCurrentOwnerOperation()
                : undefined;
        if (!current || current.did !== did) return assertOwnerOperationActive(did);
        current.signal.throwIfAborted();
        const now = performance.now();
        const recent = recentFences.get(current.token);
        if (recent && now - recent.at <= FENCE_REUSE_MS) return recent.check;
        const check = assertOwnerOperationActive(did);
        const entry = { at: now, check };
        recentFences.set(current.token, entry);
        check.catch(() => {
            if (recentFences.get(current.token) === entry) recentFences.delete(current.token);
        });
        if (recentFences.size > 1_000)
            for (const [token, fence] of recentFences)
                if (now - fence.at > FENCE_REUSE_MS) recentFences.delete(token);
        return check;
    });

const assertCredentialSnapshot = async (
    did: string,
    uri: string,
    expected: ActiveAiConsentReceipt
): Promise<void> => {
    requireCredentialOwner(did);
    await fenceOwnerOperation(did);
    if (
        !expected.credentialUris.includes(uri) ||
        !getCurrentAiCredentialUris().includes(uri) ||
        !bindAiConsentRevision(did, consentAuthorizationKey(expected))
    )
        throw new AiConsentError('Credential is outside the consent snapshot');
};

// One fresh final receipt validates the entire batch, including excluded inputs
// and empty sets. Initial scope discovery and this check are separate reads.
const assertCredentialBatchConsent = async (
    did: string,
    uris: readonly string[],
    expected: ActiveAiConsentReceipt
): Promise<ActiveAiConsentReceipt> =>
    withAiInsightTiming('consent_check', async () => {
        requireCredentialOwner(did);
        await assertOwnerOperationActive(did);
        const { receipt } = await loadActiveAiConsentData(
            await withAiInsightResolutionOperation('sdk_init', () => getLearnCard()),
            did,
            expected.purpose,
            { expectedRevision: expected.revision }
        );
        const expectedUris = new Set(expected.credentialUris),
            currentUris = new Set(receipt.credentialUris);
        if (
            receipt.revision !== expected.revision ||
            uris.some(uri => !expectedUris.has(uri) || !currentUris.has(uri))
        )
            throw new AiConsentError('Credential batch consent changed');
        await assertOwnerOperationActive(did);
        return receipt;
    });

class InvalidCredentialError extends UnrecoverableError {
    constructor() {
        super('Credential verification failed');
    }
}

// A verified credential whose claims cannot be projected. It carries no cause:
// the projector's error can quote claim text.
class CredentialProjectionError extends Error {
    constructor() {
        super('Credential could not be projected');
    }
}

// The env module is not read here: tests of modules that load this one replace
// it. Read the knob directly with the same parsing as constants/env.
const learnCardCallTimeoutMs = (): number => {
    const parsed = Number(process.env.LEARNCARD_CALL_TIMEOUT_MS);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 5_000;
};

export type CredentialReadOptions = {
    /** This read's own timeout; defaults to LEARNCARD_CALL_TIMEOUT_MS. */
    readTimeoutMs?: number;
    /**
     * The credential's location from the request's one consent read. When set,
     * scope, consent and the URI list were resolved once for the request, and
     * the per-credential checks use that bound snapshot (owner, operation fence,
     * URI membership, revision) instead of re-reading consent. The fresh
     * consent reads at the publication boundaries stay with the caller.
     */
    location?: ConsentFlowCredentialLocation;
};

/*
 * One credential read, bounded by its own timeout. A timeout or fetch error is
 * this credential's skippable failure (credential_read_timeout or
 * credential_read_failed, with the read stage and a keyed URI hash). The
 * request's own abort or deadline is not: it is rethrown untouched, so the
 * shared abort reason is never labelled as one credential's read failure.
 */
const readCredential = async (
    learnCard: Awaited<ReturnType<typeof getLearnCard>>,
    uri: string,
    timeoutMs: number
): Promise<VC | undefined> => {
    const progress = getMcpProgress();
    if (progress) {
        logSafeEvent('info', 'mcp_tool_progress', {
            mcpTool: progress.tool,
            mcpRequestId: progress.requestId,
            mcpCauseStep: 'projection',
            readStage: 'fetch',
        });
    }
    const startedAt = performance.now();
    let uriHash: string | undefined;
    const hash = () => (uriHash ??= credentialUriHash(uri));
    const slowAfterMs = credentialSlowReadMs(timeoutMs);
    const slowTimer =
        slowAfterMs === undefined
            ? undefined
            : setTimeout(() => {
                  logSafeEvent('warn', 'credential_read_slow', {
                      readStage: 'fetch',
                      uriHash: hash(),
                      durationMs: Math.round(performance.now() - startedAt),
                      ...(progress
                          ? { mcpTool: progress.tool, mcpRequestId: progress.requestId }
                          : {}),
                  });
              }, slowAfterMs);
    slowTimer?.unref?.();
    try {
        return (await timeMcpStage('read', () =>
            withAiInsightResolutionOperation('read', () =>
                boundLearnCardCall(learnCard.read.get(uri), { timeoutMs })
            )
        )) as VC | undefined;
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') throw error;
        if (getLearnCardRequestSignal()?.aborted) throw error;
        const timedOut = error instanceof Error && error.name === 'TimeoutError';
        // A non-object rejection is an unknown failure: fail closed, unmarked.
        if (error === null || typeof error !== 'object') throw error;
        markCredentialReadFailure(error, {
            code: timedOut ? 'credential_read_timeout' : 'credential_read_failed',
            readStage: 'fetch',
            uriHash: hash(),
        });
        attachVerifyFailureDiagnostics(error, {
            kind:
                classifyLearnCardFailure(error) === 'learncard_unauthorized'
                    ? 'read_unauthorized'
                    : 'read_failed',
        });
        throw error;
    } finally {
        clearTimeout(slowTimer);
    }
};

const resolveCredential = async (
    did: string,
    ref: ConsentFlowCredentialRef,
    insightEligibility = false,
    options: CredentialReadOptions = {}
): Promise<ResolvedConsentFlowCredential> => {
    const assertScope = () =>
        insightEligibility || options.location
            ? assertCredentialSnapshot(did, ref.uri, ref.consent)
            : timeMcpStage('fence', () => assertCredentialConsent(did, ref.uri, ref.consent));
    await assertScope();
    const learnCard = await timeMcpStage('sdk_init', () =>
        withAiInsightResolutionOperation('sdk_init', () => getLearnCard())
    );
    // Do not substitute Zod's parsed copy for the signed original.
    // The SDK read and verify take no signal; bound both by the request scope's
    // signal and LEARNCARD_CALL_TIMEOUT_MS so a hung call cannot hold the caller.
    const credential = await readCredential(
        learnCard,
        ref.uri,
        options.readTimeoutMs ?? learnCardCallTimeoutMs()
    );
    // SDK reads may hide validation/decryption/network failures as no result.
    // Missing data cannot establish invalidity or justify deleting retained records.
    if (!credential) {
        if (insightEligibility) throw new ExcludedInsightInput('unreadable_input');
        throw markCredentialReadFailure(
            attachVerifyFailureDiagnostics(
                new CredentialVerificationUnavailableError('read_empty'),
                { kind: 'read_empty' }
            ),
            { readStage: 'decode', uriHash: credentialUriHash(ref.uri) }
        );
    }
    if (insightEligibility && hasKnownUnsupportedInsightSuite(credential))
        throw new ExcludedInsightInput('unsupported_cryptosuite');
    // Unverifiable attempts throw a retryable, sanitized error here, before any
    // retained credential, association, vector, or provenance can be changed.
    let verification: CredentialVerificationMetadata;
    try {
        verification = await timeMcpStage('verify', () =>
            withAiInsightTiming('verification', () =>
                verifyCredentialForIngestion(
                    {
                        verificationOrigin: 'source',
                        credential,
                        credentialUri: ref.uri,
                        subjectDid: did,
                        consent: ref.consent,
                        verify: original =>
                            boundLearnCardCall(learnCard.invoke.verifyCredential(original), {
                                timeoutMs: learnCardCallTimeoutMs(),
                            }),
                    },
                    !insightEligibility
                )
            )
        );
    } catch (error) {
        // Only a failure of this credential's verifier is an eligibility outcome.
        // Consent, SDK initialization, reads, projection and storage stay outside.
        if (insightEligibility && error instanceof CredentialVerificationUnavailableError)
            throw new ExcludedInsightInput('verification_unavailable');
        throw error;
    }
    await assertScope();
    if (verification.status === 'invalid') {
        if (insightEligibility)
            throw new ExcludedInsightInput(
                verification.errors.includes('credential_subject_mismatch')
                    ? 'subject_mismatch'
                    : verification.errors.includes('verification_payload_invalid')
                      ? 'malformed_input'
                      : 'verification_failed'
            );
        const cleanUpInvalid = async () => {
            try {
                await Promise.all([
                    // Queue fencing but do not await Qdrant recovery here. The MCP
                    // read path used to wait for up to 32 unbounded cleanup units
                    // after a confirmed-invalid verify, which hung the tool past
                    // the client deadline once a busy lease no longer failed fast.
                    db.deleteVCsByUris(did, [ref.uri], { awaitCleanup: false }),
                    db.removeThreadCredentialsByUris(did, [ref.uri]),
                ]);
            } catch (error) {
                // Mongo already queued cleanup and may have removed retained rows.
                // A contended or unfinished fence must not fail chat or MCP reads.
                if (!isRetryableSourceCleanupError(error)) throw error;
            }
            await db.storeCredentialVerification(did, verification);
        };
        // MCP reads skip the credential now and clean up in the background.
        if (learnCardStoresDeferred()) deferCredentialStore(did, cleanUpInvalid);
        else await cleanUpInvalid();
        throw copyVerifyFailureDiagnostics(
            verification,
            markCredentialItemFailure(
                attachVerifyFailureDiagnostics(new InvalidCredentialError(), {
                    kind: 'verify_errors',
                }),
                'credential_invalid'
            )
        );
    }
    let projection: ModelSafeCredentialProjection;
    try {
        projection = await timeMcpStage('project', () =>
            withAiInsightResolutionOperation('projection', () =>
                projectCredential(
                    credential,
                    ref.category ?? 'Uncategorized Credential',
                    verification
                )
            )
        );
    } catch {
        // One credential that cannot be projected is dropped and logged; it must
        // not fail the page or the batch around it.
        if (insightEligibility) throw new ExcludedInsightInput('malformed_input');
        throw markCredentialItemFailure(
            attachVerifyFailureDiagnostics(new CredentialProjectionError(), {
                kind: 'projection_failed',
            }),
            'credential_projection_failed'
        );
    }
    await assertScope();
    const recheckConsent = assertScope;
    const store = () =>
        timeMcpStage('store', async () => {
            await withAiInsightResolutionOperation('store_verification', () =>
                db.storeCredentialVerification(did, verification, recheckConsent)
            );
            await withAiInsightResolutionOperation('store_raw', () =>
                db.storeRawCredential(
                    did,
                    {
                        uri: ref.uri,
                        contentHash: verification.contentHash,
                        rawCredentialJson: JSON.stringify(credential),
                    },
                    recheckConsent
                )
            );
        });
    // MCP reads never wait on store (~2s per credential in prod): the
    // projection is ready, so the write runs in the background queue, which
    // still re-checks consent and holds an owner operation.
    if (learnCardStoresDeferred()) deferCredentialStore(did, store);
    else await store();
    await assertScope();
    return { ...ref, credential, verification, projection };
};

class ExcludedInsightInput extends Error {
    constructor(readonly reason: InsightInputExclusionReason) {
        super('Credential excluded from AI input');
    }
}

type InsightResolution =
    ResolvedConsentFlowCredential | { exclusionReason: InsightInputExclusionReason };

// Eligibility never changes retained wallet data. Request-wide operations and
// processing failures remain outside the narrow per-credential outcome catch.
const resolveEligibleInsightCredential = async (
    did: string,
    ref: ConsentFlowCredentialRef
): Promise<InsightResolution> =>
    withAiInsightStage('credential_resolution', async () => {
        try {
            return await resolveCredential(did, ref, true);
        } catch (error) {
            if (!(error instanceof ExcludedInsightInput)) throw error;
            await assertCredentialSnapshot(did, ref.uri, ref.consent);
            return { exclusionReason: error.reason };
        }
    });

const resolveVerifiedCredential = (
    did: string,
    ref: ConsentFlowCredentialRef,
    options: CredentialReadOptions = {}
): Promise<ResolvedConsentFlowCredential> =>
    withAiInsightStage('credential_resolution', async () => {
        try {
            const resolved = await resolveCredential(did, ref, false, options);
            recordCredentialOutcome(did, ref.uri);
            // The chat context and the preload reuse this until the TTL or the
            // revision changes.
            rememberVerifiedCredential(did, ref.uri, ref.consent.revision, resolved);
            return resolved;
        } catch (error) {
            // Remembers permanent failures so the chat context can skip them.
            recordCredentialOutcome(did, ref.uri, error);
            forgetVerifiedCredential(did, ref.uri, ref.consent.revision);
            throw error;
        }
    });

export const MAX_PROJECTION_ATTEMPTS = 3;

const projectionRestartReason = (error: unknown): string | undefined => {
    // A failed read is that credential's skip; re-reading it would only spend
    // the budget its siblings need.
    if (isCredentialReadFailure(error)) return undefined;
    if (!isRetryableSourceCleanupError(error) || !(error instanceof Error)) return undefined;
    const reason = sanitizeCauseMessage(error.message);
    return reason && reason !== 'unrecognized' ? reason : undefined;
};

const attachProjectionStep = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        throw attachCauseStep(error, 'projection');
    }
};

/* Per-credential scope, consent read and URI lookup, for callers that did
 * not resolve them once for the whole request. */
const resolveCredentialLocation = async (
    did: string,
    uri: string,
    receipt: ActiveAiConsentReceipt
): Promise<ConsentFlowCredentialLocation> => {
    await withCauseStep('scope', () => timeMcpStage('scope', () => requireCredentialOwner(did)));
    const { records, receipt: current } = await withCauseStep('consent_read', async () =>
        loadActiveAiConsentData(await getLearnCard(), did, receipt.purpose, {
            expectedRevision: consentAuthorizationKey(receipt),
        })
    );
    return withCauseStep('uri_list', () =>
        timeMcpStage('uri_list', async () => {
            if (
                current.revision !== receipt.revision ||
                !receipt.credentialUris.includes(uri) ||
                !current.credentialUris.includes(uri)
            )
                throw new AiConsentError('Credential consent changed');
            const found = records
                .flatMap(record => extractConsentFlowCredentialRefs(record))
                .find(ref => ref.uri === uri);
            if (!found) throw new AiConsentError('Credential is not shared');
            return found;
        })
    );
};

const resolveVerifiedCredentialProjectionOnce = async (
    did: string,
    uri: string,
    receipt: ActiveAiConsentReceipt,
    options: CredentialReadOptions
): Promise<ModelSafeCredentialProjection> => {
    const prepared = options.location;
    let location: ConsentFlowCredentialLocation;
    if (prepared) {
        // Scope, consent and the URI list were resolved once for this request.
        requireCredentialOwner(did);
        if (prepared.uri !== uri || !receipt.credentialUris.includes(uri))
            throw new AiConsentError('Credential is not shared');
        location = prepared;
    } else {
        location = await resolveCredentialLocation(did, uri, receipt);
    }
    // A recent verification under this same consent revision skips the read
    // and verify; consent is still checked above and below. A known-bad URI
    // is not re-read or re-verified. Callers wrap this in the logged
    // 'projection' step; here the step is only attached, not logged again.
    return attachProjectionStep(async () => {
        const knownBad = knownBadCredentialKind(did, uri);
        if (knownBad === 'invalid') {
            throw markCredentialItemFailure(new InvalidCredentialError(), 'credential_invalid');
        }
        if (knownBad === 'unverifiable') {
            throw new CredentialVerificationUnavailableError(
                'unrecognized_verifier_error',
                'undefined_jsonld_term'
            );
        }
        const projection =
            getVerifiedCredential<ResolvedConsentFlowCredential>(did, uri, receipt.revision)
                ?.projection ??
            (
                await resolveVerifiedCredential(
                    did,
                    {
                        ...location,
                        consent: receipt,
                    },
                    options
                )
            ).projection;
        if (prepared) await assertCredentialSnapshot(did, uri, receipt);
        else await timeMcpStage('fence', () => assertCredentialConsent(did, uri, receipt));
        return projection;
    });
};

/*
 * Each credential is read and verified at most once per request: callers in
 * the same request share one in-flight or settled result (a failure too).
 */
export const resolveVerifiedCredentialProjection = (
    did: string,
    uri: string,
    receipt: ActiveAiConsentReceipt,
    options: CredentialReadOptions = {}
): Promise<ModelSafeCredentialProjection> =>
    oncePerLearnCardRequest(`credential-projection\n${did}\n${receipt.revision}\n${uri}`, () =>
        resolveVerifiedCredentialProjectionUncached(did, uri, receipt, options)
    );

const resolveVerifiedCredentialProjectionUncached = async (
    did: string,
    uri: string,
    receipt: ActiveAiConsentReceipt,
    options: CredentialReadOptions
): Promise<ModelSafeCredentialProjection> => {
    const signal = getLearnCardRequestSignal();
    for (let attempt = 1; ; attempt += 1) {
        try {
            return await resolveVerifiedCredentialProjectionOnce(did, uri, receipt, options);
        } catch (error) {
            const restartReason = projectionRestartReason(error);
            if (!restartReason || attempt >= MAX_PROJECTION_ATTEMPTS || signal?.aborted) {
                throw error;
            }
            logSafeEvent('info', 'projection_restart', {
                restartReason: restartReason as
                    | 'source_cleanup_busy'
                    | 'source_cleanup_lease_expired'
                    | 'source_cleanup_pending'
                    | 'source_cleanup_pending_ingest'
                    | 'source_cleanup_scope_changed'
                    | 'consent_changed'
                    | 'snapshot_revision_mismatch',
                attempt,
            });
        }
    }
};

/**
 * Fetch credentials from the LearnCard service
 */
export async function fetchCredentials(
    did: string,
    options: { preload?: boolean } = {}
): Promise<DBCredentialRecord[]> {
    requireCredentialOwner(did);
    const { records, receipt } = await loadActiveAiConsentData(
        await getLearnCard(),
        did,
        'credential-ingestion'
    );
    const refs = dedupeCredentialRefs(records.flatMap(extractConsentFlowCredentialRefs));
    // Each resolution makes several signed LearnCard calls; cap the fan-out.
    // One unreadable or unverifiable credential is skipped, not the whole set.
    // The preload reuses recent verifications under the same consent revision
    // (consent is still asserted below), and its uncached reads yield to a chat
    // start reading credential context for this owner.
    const resolveRef = async (ref: (typeof refs)[number]) => {
        if (!options.preload) return resolveVerifiedCredential(did, ref);
        const cached = (): ResolvedConsentFlowCredential | undefined =>
            getVerifiedCredential<ResolvedConsentFlowCredential>(
                did,
                ref.uri,
                ref.consent.revision
            );
        const hit = cached();
        if (hit) return hit;
        await waitForCredentialContextIdle(did, {
            signal: getLearnCardRequestSignal(),
        });
        return cached() ?? (await resolveVerifiedCredential(did, ref));
    };
    const { loaded: resolved } = await settleCredentialBatch(
        'preload',
        refs.map(ref => () => resolveRef(ref)),
        { concurrency: CREDENTIAL_PRELOAD_CONCURRENCY }
    );
    for (const ref of refs) await assertCredentialConsent(did, ref.uri, receipt);
    return resolved.map(item => ({
        id: item.uri,
        uri: item.uri,
        category: item.category ?? 'Uncategorized Credential',
        credential: item.credential,
        rawCredentialJson: JSON.stringify(item.credential),
        aiContext: serializeModelSafeCredentialProjection(item.projection),
        createdAt: item.verification.provenance.retrievedAt,
        source: 'wallet' as const,
        verification: item.verification,
        projection: item.projection,
    }));
}

// Insight coverage contains fresh, verified source inputs only. Background
// ingestion shares per-input exclusion; ordinary fetch/chat verification stays strict.
export const fetchInsightCredentials = async (
    did: string
): Promise<{
    credentials: DBCredentialRecord[];
    coverage: InsightInputCoverage;
}> => {
    requireCredentialOwner(did);
    const { records, receipt } = await withAiInsightTiming('consent_check', async () =>
        loadActiveAiConsentData(
            await withAiInsightResolutionOperation('sdk_init', () => getLearnCard()),
            did,
            'credential-ingestion'
        )
    );
    const refs = dedupeCredentialRefs(records.flatMap(extractConsentFlowCredentialRefs));
    const resolved = await settleAll(refs.map(ref => resolveEligibleInsightCredential(did, ref)));
    await assertCredentialBatchConsent(
        did,
        refs.map(ref => ref.uri),
        receipt
    );
    const verified = resolved.filter(
        (item): item is ResolvedConsentFlowCredential => !('exclusionReason' in item)
    );
    const eligible = verified.filter(item => item.category !== AI_INSIGHT_CREDENTIAL_TYPE);
    const excludedCount = resolved.length - verified.length;
    const exclusionCounts = new Map<InsightInputExclusionReason, number>();
    for (const item of resolved) {
        if ('exclusionReason' in item)
            exclusionCounts.set(
                item.exclusionReason,
                (exclusionCounts.get(item.exclusionReason) ?? 0) + 1
            );
    }
    return {
        credentials: eligible.map(item => ({
            id: item.uri,
            uri: item.uri,
            category: item.category ?? 'Uncategorized Credential',
            credential: item.credential,
            rawCredentialJson: JSON.stringify(item.credential),
            aiContext: serializeModelSafeCredentialProjection(item.projection),
            createdAt: item.verification.provenance.retrievedAt,
            source: 'wallet' as const,
            verification: item.verification,
            projection: item.projection,
        })),
        coverage: {
            verifiedCount: eligible.length,
            excludedCount,
            exclusions: [...exclusionCounts].map(([reason, count]) => ({
                reason,
                count,
            })),
        },
    };
};

/**
 * Convert a verified projection into deterministic chat-friendly context.
 */
export function ingestCredential(vc: {
    projection: ModelSafeCredentialProjection;
    verification: CredentialVerificationMetadata;
}): string {
    return serializeModelSafeCredentialProjection(
        getCredentialProjection({ ...vc, category: vc.projection.category })
    );
}

/**
 * Process credentials for a user, only ingesting new ones.
 * This function is intended to be run as part of a background job.
 */
export async function processCredentials(
    did: string,
    job: Pick<Job<CredentialIngestionJobData>, 'id' | 'updateProgress'>
): Promise<CredentialIngestionMetrics> {
    requireCredentialOwner(did);
    const startedAt = Date.now();
    const learnCard = await withAiInsightResolutionOperation('sdk_init', () => getLearnCard());
    const dbCredentials = await db.getCredentialRecords(did);
    const dbCredentialByUri = new Map(
        dbCredentials.map(credential => [credential.uri, credential])
    );
    const { records: pageRecords, receipt } = await loadActiveAiConsentData(
        learnCard,
        did,
        'credential-ingestion'
    );
    let currentProgress = 5;
    let credentialsChanged = false;
    let totalSeen = 0;
    let indexed = 0;
    let repaired = 0;
    let alreadyComplete = 0;
    let failed = 0;
    let excludedUnsupported = 0;
    let excludedVerification = 0;
    const walletUris = new Set<string>();

    console.log(`[ingestion] (${job.id}) starting credential ingestion for DID ${did}`);

    const currentPageRefs = dedupeCredentialRefs(
        pageRecords.flatMap(record => extractConsentFlowCredentialRefs(record))
    );

    if (totalSeen + currentPageRefs.length > 10_000)
        throw new UnrecoverableError(`Credential ingestion exceeded 10000 records for DID ${did}`);
    const pageUris = currentPageRefs.map(({ uri }) => uri);
    const coverage = await getCredentialVectorCoverage(did, pageUris);

    for (const uri of pageUris) walletUris.add(uri);
    totalSeen += currentPageRefs.length;

    const resolutionOutcomes = await Promise.allSettled(
        currentPageRefs.map(ref => resolveEligibleInsightCredential(did, ref))
    );
    // A credential whose own read failed is skipped so the rest still index;
    // the job then fails with that error and retries it. Others fail now.
    const skippedReads = resolutionOutcomes.flatMap((outcome, index) =>
        outcome.status === 'rejected' && isCredentialItemFailure(outcome.reason)
            ? [{ index, error: outcome.reason as unknown }]
            : []
    );
    const resolutionFailure = resolutionOutcomes.find(
        (outcome): outcome is PromiseRejectedResult =>
            outcome.status === 'rejected' &&
            !skippedReads.some(({ error }) => error === outcome.reason)
    );
    if (resolutionFailure) throw resolutionFailure.reason;
    if (skippedReads.length === currentPageRefs.length && skippedReads[0])
        throw skippedReads[0].error;
    for (const { index, error } of skippedReads)
        logCredentialSkip('ingestion', index, currentPageRefs.length, error);
    logCredentialBatch(
        'ingestion',
        currentPageRefs.length - skippedReads.length,
        skippedReads.length
    );
    const resolutions = resolutionOutcomes.map(outcome =>
        outcome.status === 'fulfilled' ? outcome.value : undefined
    );
    const batchReceipt = await assertCredentialBatchConsent(did, pageUris, receipt);

    const outcomes = await Promise.allSettled(
        currentPageRefs.map(async (credential, index) => {
            const cachedCredential = dbCredentialByUri.get(credential.uri);
            const vectorCount = coverage.get(credential.uri)?.size ?? 0;
            const vectorsComplete = vectorCount === CREDENTIAL_VECTOR_COLLECTION_COUNT;

            currentProgress += Math.round((1 / Math.max(totalSeen, 1)) * 85);
            await job.updateProgress({
                progress: Math.min(currentProgress, 90),
                message: `Verifying credential ${index + 1}/${currentPageRefs.length}: ${credential.uri}`,
            });

            try {
                const resolved = resolutions[index];
                if (!resolved) return;
                if ('exclusionReason' in resolved) {
                    if (resolved.exclusionReason === 'unsupported_cryptosuite')
                        excludedUnsupported += 1;
                    else excludedVerification += 1;
                    return;
                }
                const { credential: parsedCredential, verification, projection } = resolved;
                const contentChanged =
                    cachedCredential?.verification?.contentHash !== verification.contentHash;
                const consentChanged =
                    cachedCredential?.verification?.consent?.revision !==
                    verification.consent.revision;
                const projectionChanged =
                    JSON.stringify(cachedCredential?.projection) !==
                    serializeModelSafeCredentialProjection(projection);
                const aiContext = serializeModelSafeCredentialProjection(projection);
                const recordChanged =
                    contentChanged ||
                    consentChanged ||
                    projectionChanged ||
                    cachedCredential?.aiContext !== aiContext ||
                    cachedCredential?.verification?.status !== 'valid' ||
                    !cachedCredential?.verification?.checks.includes('proof');

                if (cachedCredential && !recordChanged && vectorsComplete) {
                    const verifiedCredential = {
                        ...cachedCredential,
                        credential: parsedCredential,
                        rawCredentialJson: JSON.stringify(parsedCredential),
                        verification,
                        projection,
                    };

                    await assertCredentialSnapshot(did, credential.uri, credential.consent);
                    await db.storeVC(did, verifiedCredential);
                    dbCredentialByUri.set(credential.uri, verifiedCredential);
                    alreadyComplete += 1;
                    return;
                }

                const vc: DBCredentialRecord =
                    cachedCredential && !recordChanged
                        ? {
                              ...cachedCredential,
                              credential: parsedCredential,
                              rawCredentialJson: JSON.stringify(parsedCredential),
                              verification,
                              projection,
                          }
                        : cachedCredential && !contentChanged
                          ? {
                                ...cachedCredential,
                                credential: parsedCredential,
                                rawCredentialJson: JSON.stringify(parsedCredential),
                                aiContext: '',
                                verification,
                                projection,
                            }
                          : {
                                id: credential.uri,
                                uri: credential.uri,
                                category: credential.category ?? 'Uncategorized Credential',
                                credential: parsedCredential,
                                rawCredentialJson: JSON.stringify(parsedCredential),
                                aiContext: '',
                                createdAt: new Date().toISOString(),
                                title: null,
                                source: 'wallet',
                                verification,
                                projection,
                            };

                if (!vc.aiContext)
                    vc.aiContext = ingestCredential({
                        projection,
                        verification,
                    });

                await assertCredentialSnapshot(did, credential.uri, credential.consent);
                await db.storeVC(did, vc);
                dbCredentialByUri.set(vc.uri, vc);

                if (!vectorsComplete || recordChanged) {
                    await storeCredentialEmbeddings(vc, did, batchReceipt);
                    indexed += 1;

                    if (cachedCredential || vectorCount > 0) repaired += 1;
                }

                if (!cachedCredential || recordChanged) credentialsChanged = true;
            } catch (error) {
                if (error instanceof InvalidCredentialError) {
                    dbCredentialByUri.delete(credential.uri);
                    failed += 1;
                    if (cachedCredential) credentialsChanged = true;
                    return;
                }
                // Unknown parser and dependency failures remain retryable/fail closed.
                throw error;
            }
        })
    );

    const retryableFailure = outcomes.find(
        (outcome): outcome is PromiseRejectedResult => outcome.status === 'rejected'
    );
    if (retryableFailure) throw retryableFailure.reason;
    if (skippedReads[0]) throw skippedReads[0].error;

    const removedCount = await reconcileDeletedCredentials(did, Array.from(walletUris));
    if (removedCount > 0) credentialsChanged = true;

    const durationMs = Date.now() - startedAt;
    const metrics: CredentialIngestionMetrics = {
        totalSeen,
        indexed,
        repaired,
        alreadyComplete,
        failed,
        excludedUnsupported,
        excludedVerification,
        changed: credentialsChanged,
        durationMs,
    };

    console.log(
        `[ingestion] (${job.id}) finished for DID ${did}: ${JSON.stringify({
            ...metrics,
            removedStale: removedCount,
            changed: credentialsChanged,
        })}`
    );

    await job.updateProgress({
        progress: 100,
        message: `Finished indexing ${totalSeen} credentials`,
    });

    if (
        (credentialsChanged || excludedUnsupported + excludedVerification > 0) &&
        totalSeen > excludedUnsupported + excludedVerification &&
        !(await isDataErasureRequested(did))
    ) {
        try {
            await generateAIInsightCredential(did);
        } catch (error) {
            console.error(
                `[ingestion] Failed to generate AI insight credential for DID ${did}:`,
                error
            );
        }
    }

    return metrics;
}

export const credentialServiceApi = {
    fetchCredentials,
    ingestCredential,
    processCredentials,
};

/**
 * Warm up the topics cache in the background
 */
export async function warmUpTopicsCache(did: string): Promise<string[]> {
    const credentials = await fetchCredentials(did);
    const topics = await _warmUpTopicsCache(did, credentials);
    for (const credential of credentials)
        await assertCredentialConsent(did, credential.uri, credential.verification!.consent);
    return topics;
}

// One preload per owner at a time; socket opens that overlap share it.
type InFlightPreload = {
    promise: Promise<{ topics: string[]; count: number }>;
    signal?: AbortSignal;
};
const inFlightPreloads = new Map<string, InFlightPreload>();

const startPreload = (did: string, signal: AbortSignal | undefined): InFlightPreload => {
    const drop = (): void => {
        if (inFlightPreloads.get(did) === preload) inFlightPreloads.delete(did);
    };
    const preload: InFlightPreload = {
        promise: preloadSuggestedTopics(did, signal).finally(() => {
            signal?.removeEventListener('abort', drop);
            drop();
        }),
        signal,
    };
    // A cancelled preload is not shared any more, even if its work lingers.
    signal?.addEventListener('abort', drop, { once: true });
    inFlightPreloads.set(did, preload);
    return preload;
};

/**
 * Generate suggested topics and count from one freshly verified credential read.
 * A call while one is in flight for the same owner joins it; each caller's own
 * signal still releases that caller.
 */
export async function getSuggestedTopics(
    did: string,
    options: { signal?: AbortSignal } = {}
): Promise<{ topics: string[]; count: number }> {
    for (;;) {
        const preload = inFlightPreloads.get(did) ?? startPreload(did, options.signal);
        try {
            return await boundLearnCardCall(preload.promise, {
                signal: options.signal,
                detached: true,
            });
        } catch (error) {
            // The preload this call joined was cancelled by the caller that started
            // it, not by this one: start (or join) a fresh one.
            if (
                preload.signal?.aborted &&
                preload.signal !== options.signal &&
                !options.signal?.aborted
            )
                continue;
            throw error;
        }
    }
}

function preloadSuggestedTopics(
    did: string,
    signal: AbortSignal | undefined
): Promise<{ topics: string[]; count: number }> {
    // One preload request: one consent contract read shared by every check.
    return runWithLearnCardRequestScope({ signal }, async () => {
        const credentials = await fetchCredentials(did, { preload: true });
        const topics = await _getSuggestedTopics(did, credentials);
        for (const credential of credentials)
            await assertCredentialConsent(did, credential.uri, credential.verification!.consent);
        return { topics, count: credentials.length };
    });
}
type FileProcessingCode =
    | 'INPUT_INVALID'
    | 'FILE_TOO_LARGE'
    | 'READ_FAILED'
    | 'NO_READABLE_TEXT'
    | 'CONTENT_REJECTED'
    | 'CLASSIFICATION_FAILED'
    | 'MODEL_FAILED'
    | 'CONSTRUCTION_FAILED'
    | 'CONSENT_DENIED'
    | 'OWNER_OPERATION_UNAVAILABLE';

class FileProcessingStageError extends Error {
    constructor(readonly code: FileProcessingCode) {
        super('File processing failed');
    }
}

const parseFileCore = async (
    file: string,
    did: string,
    fileType: FileUploadTypesEnum,
    setStage: (stage: 'read' | 'classify' | 'extract' | 'construct') => void
) => {
    setStage('read');
    let text: string;
    try {
        text = (await extractTextFromBase64File(file)).text;
        if (!text.trim()) throw new FileProcessingStageError('NO_READABLE_TEXT');
    } catch (error) {
        if (
            error instanceof AiConsentError ||
            error instanceof DataErasureRequestedError ||
            error instanceof FileProcessingStageError
        )
            throw error;
        throw new FileProcessingStageError('READ_FAILED');
    }

    // Classify independently of the caller-provided type so an incorrectly
    // selected upload option still reaches the correct parser.
    setStage('classify');
    const classification = await classifyFileContent(text);

    if (classification.fileType === 'unsupported' || classification.confidence < 0.7) {
        throw new FileProcessingStageError('CONTENT_REJECTED');
    }

    const detectedFileType = classification.fileType;
    const classificationMetadata = {
        requestedFileType: fileType,
        detectedFileType,
        confidence: classification.confidence,
        corrected: detectedFileType !== fileType,
        reason: classification.reason,
    };

    setStage('extract');
    // extract structured data from the text
    const { systemPrompt, output } = getAiPromptForFile(detectedFileType, text);

    let result;
    try {
        result = await aiCall({
            model: FORMATTING_MODEL,
            systemPrompt,
            message: `Please extract structured data from this ${detectedFileType} text:\n\n${text}`,
            output,
        });
    } catch (error) {
        if (error instanceof AiConsentError || error instanceof DataErasureRequestedError)
            throw error;
        throw new FileProcessingStageError('MODEL_FAILED');
    }
    setStage('construct');

    if (detectedFileType === FileUploadTypesEnum.Transcript) {
        const parsedTranscript = ParsedTranscriptSchema.parse(result);
        const clr = toUnsignedTranscriptClr(parsedTranscript, did);
        const validatedClr = UnsignedClrCredentialValidator.parse(clr);

        return {
            text,
            result: parsedTranscript,
            classification: classificationMetadata,
            vcs: [
                {
                    vc: validatedClr,
                    metadata: {
                        name: validatedClr.name ?? `${parsedTranscript.institution} Transcript`,
                        category: BoostCategoryOptionsEnum.learningHistory,
                    },
                },
            ],
        };
    }

    const {
        work = [],
        education = [],
        certificates = [],
        degree,
        fieldOfStudy,
        institution,
        dateAwarded,
    } = result || {};

    const vcs: {
        vc: UnsignedVC;
        metadata: { name: string; category: string };
    }[] = [];

    const createBoost = async ({
        name,
        type,
        description,
        narrative,
        category,
        source,
        alignment,
        evidence,
    }: {
        name: string;
        type: string;
        description: string;
        narrative: string;
        category: BoostCategoryOptionsEnum;
        source?: Source;
        alignment?: Alignment[];
        evidence?: Evidence[];
    }) => {
        const safeName = name || 'Untitled';
        const safeType = type || 'ext:Generic_Achievement';
        const safeDescription = description || 'No description provided.';
        const safeNarrative = narrative || 'Details not available.';

        const learnCard = await getLearnCard();
        const unsignedVc = await learnCard.invoke.newCredential({
            boostName: safeName,
            type: 'boost',
            did: learnCard.id.did(),
            subject: did,
            issuanceDate: new Date().toISOString(),
            achievementName: safeName,
            achievementType: safeType,
            achievementDescription: safeDescription,
            achievementNarrative: safeNarrative,
            source,
            alignment,
            evidence,
        });

        // These are self-attested credentials, so the issuer is the subject
        unsignedVc.issuer = { id: did };

        return { vc: unsignedVc, metadata: { name: safeName, category } };
    };

    // 💼 Work → Work History
    for (const job of work) {
        const position = job?.position || 'Unknown Position';
        const company = job?.company || 'Unknown Company';
        const customLabel = `${position} at ${company}`;
        vcs.push(
            await createBoost({
                name: customLabel,
                type: constructCustomType('Work History', 'Job'),
                description: `Worked as a ${position} at ${company}`,
                narrative:
                    job?.summary || `Experience gained working at ${company} as ${position}.`,
                category: BoostCategoryOptionsEnum.workHistory,
            })
        );
    }

    // 🎓 Education → Learning History
    for (const edu of education) {
        const institution = edu?.institution || 'Unknown Institution';
        const degree = edu?.degree || 'Unknown Degree';
        const field = edu?.fieldOfStudy || 'General Studies';
        const name = `${degree} in ${field}`;
        vcs.push(
            await createBoost({
                name,
                type: constructCustomType('Learning History', degree),
                description: `Graduated from ${institution}`,
                narrative: `Completed a ${degree} in ${field} at ${institution}.`,
                category: BoostCategoryOptionsEnum.learningHistory,
            })
        );
    }

    // 🏅 Certificates → Accomplishment
    for (const cert of certificates) {
        const certName = cert?.certificateName || 'Untitled Certificate';
        const issuer = cert?.issuer || 'Unknown Issuer';
        vcs.push(
            await createBoost({
                name: certName,
                type: constructCustomType('Accomplishment', certName),
                description: `Issued by ${issuer}`,
                narrative:
                    cert?.description ||
                    `Received ${certName} from ${issuer}${
                        cert?.dateIssued ? ` on ${cert.dateIssued}` : ''
                    }.`,
                category: BoostCategoryOptionsEnum.accomplishment,
            })
        );
    }

    // 🎓 Diploma
    if (detectedFileType === FileUploadTypesEnum.Diploma && degree && institution) {
        const safeDegree = degree || 'Diploma';
        const safeField = fieldOfStudy || null;
        const safeInstitution = institution || 'Unknown Institution';
        const name = safeDegree;
        const narrative = `Awarded a ${safeDegree}${
            safeField ? ` in ${safeField}` : ''
        } by ${safeInstitution}${dateAwarded ? ` on ${dateAwarded}` : ''}.`;

        vcs.push(
            await createBoost({
                name,
                type: constructCustomType('Learning History', name),
                description: `Diploma from ${safeInstitution}`,
                narrative,
                category: BoostCategoryOptionsEnum.learningHistory,
            })
        );
    }

    return {
        text,
        result,
        classification: classificationMetadata,
        vcs,
    };
};

const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sizeBucket = (length: number) =>
    length < 100 * 1024
        ? 'under_100kb'
        : length < 1024 * 1024
          ? 'under_1mb'
          : length < 4 * 1024 * 1024
            ? 'under_4mb'
            : 'over_4mb';

export const parseFile = async (
    file: string,
    did: string,
    fileType: FileUploadTypesEnum,
    diagnostics: {
        enabled?: boolean;
        operationId?: string;
        attemptId?: string;
        attempt?: number;
    } = {}
) => {
    const operationId =
        diagnostics.operationId && FILE_ID.test(diagnostics.operationId)
            ? diagnostics.operationId
            : crypto.randomUUID();
    const attemptId =
        diagnostics.attemptId && FILE_ID.test(diagnostics.attemptId)
            ? diagnostics.attemptId
            : crypto.randomUUID();
    const attempt =
        Number.isInteger(diagnostics.attempt) &&
        diagnostics.attempt! >= 1 &&
        diagnostics.attempt! <= 100
            ? diagnostics.attempt!
            : 1;
    const started = performance.now();
    const size = typeof file === 'string' ? Math.floor(file.length * 0.75) : 0;
    const base = {
        version: 1 as const,
        operationId,
        attemptId,
        attempt,
        durationMs: 0,
        sizeBucket: sizeBucket(size),
        fileType,
        credentialCount: 0,
        pipelineVersion: 'file-extraction-v1' as const,
        model: getBedrockGenerationModelForAudit(FORMATTING_MODEL),
        ocrModel: 'tesseract-local' as const,
    };
    const progress: {
        stage: 'input' | 'read' | 'classify' | 'extract' | 'construct';
    } = { stage: 'input' };
    try {
        const delimiter = typeof file === 'string' ? file.indexOf('base64,') : -1;
        if (
            typeof file !== 'string' ||
            !Object.values(FileUploadTypesEnum).includes(fileType) ||
            delimiter <= 0 ||
            delimiter + 'base64,'.length === file.length
        )
            throw new FileProcessingStageError('INPUT_INVALID');
        if (size > 4 * 1024 * 1024) throw new FileProcessingStageError('FILE_TOO_LARGE');
        const result = await parseFileCore(file, did, fileType, nextStage => {
            progress.stage = nextStage;
        });
        const count = result.vcs.length;
        const processing = {
            ...base,
            stage: 'complete' as const,
            outcome: count ? ('success' as const) : ('empty' as const),
            code: count ? ('OK' as const) : ('ZERO_STRUCTURED_ITEMS' as const),
            durationMs: Math.min(3_600_000, Math.max(0, Math.round(performance.now() - started))),
            detectedFileType: result.classification.detectedFileType,
            credentialCount: count,
        };
        if (diagnostics.enabled === true) {
            logSafeEvent('info', 'file_processing_completed', {
                operationId,
                attemptId,
                attempt,
                fileStage: 'complete',
                outcome: processing.outcome,
                failureCode: processing.code,
                count,
                durationMs: processing.durationMs,
                sizeBucket: processing.sizeBucket,
                fileType,
                detectedFileType: processing.detectedFileType,
                pipelineVersion: base.pipelineVersion,
                model: base.model,
                ocrModel: base.ocrModel,
            });
        }
        return { ...result, processing };
    } catch (error) {
        const privacyFailure =
            error instanceof AiConsentError || error instanceof DataErasureRequestedError;
        const stage = progress.stage;
        const code: FileProcessingCode =
            error instanceof FileProcessingStageError
                ? error.code
                : error instanceof AiConsentError
                  ? 'CONSENT_DENIED'
                  : error instanceof DataErasureRequestedError
                    ? 'OWNER_OPERATION_UNAVAILABLE'
                    : stage === 'read'
                      ? 'READ_FAILED'
                      : stage === 'classify'
                        ? 'CLASSIFICATION_FAILED'
                        : stage === 'extract'
                          ? 'MODEL_FAILED'
                          : stage === 'construct'
                            ? 'CONSTRUCTION_FAILED'
                            : 'INPUT_INVALID';
        const status =
            error instanceof DataErasureRequestedError
                ? 410
                : error instanceof AiConsentError
                  ? 403
                  : code === 'INPUT_INVALID' || code === 'FILE_TOO_LARGE'
                    ? 400
                    : code === 'CONTENT_REJECTED' || code === 'NO_READABLE_TEXT'
                      ? 422
                      : code === 'OWNER_OPERATION_UNAVAILABLE'
                        ? 410
                        : code === 'CONSTRUCTION_FAILED'
                          ? 500
                          : 503;
        const processing = {
            ...base,
            stage,
            outcome: 'failed' as const,
            code,
            durationMs: Math.min(3_600_000, Math.max(0, Math.round(performance.now() - started))),
        };
        if (diagnostics.enabled === true) {
            logSafeEvent('error', 'file_processing_failed', {
                operationId,
                attemptId,
                attempt,
                fileStage: stage,
                outcome: 'failed',
                failureCode: code,
                durationMs: processing.durationMs,
                sizeBucket: processing.sizeBucket,
                fileType,
                pipelineVersion: base.pipelineVersion,
                model: base.model,
                ocrModel: base.ocrModel,
            });
        }
        const safeMessage =
            privacyFailure && error instanceof Error
                ? error.message
                : code === 'INPUT_INVALID'
                  ? 'Invalid file upload'
                  : code === 'FILE_TOO_LARGE'
                    ? 'File is too large'
                    : "We couldn't process this document. Please try again.";
        throw Object.assign(new Error(safeMessage), { processing, status });
    }
};
