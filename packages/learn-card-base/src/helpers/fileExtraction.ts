import { aiPassportFetch } from './aiPassportAuth';
import { addActiveLocaleToUrl } from '../i18n';
import { networkStore } from '../stores/NetworkStore';
import { getDiagnosticCollectionContext, getLogger } from '../logging/logger';
import type { DiagnosticCollectionContext } from '../logging/logger';
import {
    FileExtractionAttemptValidator,
    FileExtractionDiagnosticValidator,
    FileProcessingMetadataValidator,
    FILE_KINDS,
} from '../types/file-extraction';
import { FileExtractionResponseValidator } from '../types/file-extraction-credentials';
import type {
    FileExtractionAttempt,
    FileExtractionDiagnostic,
    FileExtractionResponse,
    FileProcessingMetadata,
} from '../types/file-extraction';

export type { FileExtractionAttempt, FileProcessingMetadata } from '../types/file-extraction';

type FileKind = (typeof FILE_KINDS)[number];
type ClientFailureCode = 'RESPONSE_INVALID' | 'NETWORK_FAILED';
const log = getLogger('file-extraction');
const operationOwners = new Map<string, DiagnosticCollectionContext>();
const MESSAGES: Record<string, string> = {
    INPUT_INVALID: 'We could not read that file. Please choose it again.',
    FILE_TOO_LARGE: 'This file is too large. Please choose a file smaller than 4 MB.',
    READ_FAILED: 'We could not read this file. Please try a different file.',
    NO_READABLE_TEXT: 'We could not find readable text in this file.',
    CONTENT_REJECTED: 'We could not identify a supported document in this file.',
    CLASSIFICATION_FAILED: 'We could not process this file right now. Please try again.',
    MODEL_FAILED: 'We could not process this file right now. Please try again.',
    CONSTRUCTION_FAILED: 'We could not prepare credentials from this file. Please try again.',
    CONSENT_DENIED: 'AI processing is not available for this account.',
    OWNER_OPERATION_UNAVAILABLE: 'We could not process this file right now. Please try again.',
    RESPONSE_INVALID: 'We received an incomplete result. Please try again.',
    NETWORK_FAILED: 'Connection issue. Please check your internet and try again.',
};

export class FileExtractionError extends Error {
    readonly code: string;
    readonly processing?: FileProcessingMetadata;
    readonly statusCode?: number;

    constructor(code: string, processing?: FileProcessingMetadata, statusCode?: number) {
        super(Object.hasOwn(MESSAGES, code) ? MESSAGES[code] : MESSAGES.MODEL_FAILED);
        this.name = 'FileExtractionError';
        this.code = code;
        this.processing = processing;
        this.statusCode = statusCode;
    }
}

/** A retry belongs to the same upload operation, but always gets a fresh attempt ID. */
export const createFileExtractionAttempt = (
    previous?: FileExtractionAttempt
): FileExtractionAttempt => {
    const previousAttempt = previous ? FileExtractionAttemptValidator.parse(previous) : undefined;
    if (previousAttempt?.attempt === 100) throw new FileExtractionError('INPUT_INVALID');
    const attempt = {
        operationId: previousAttempt?.operationId ?? crypto.randomUUID(),
        attemptId: crypto.randomUUID(),
        attempt: (previousAttempt?.attempt ?? 0) + 1,
    };
    if (!previousAttempt || !operationOwners.has(attempt.operationId)) {
        operationOwners.set(
            attempt.operationId,
            previousAttempt ? { enabled: false, identity: null } : getDiagnosticCollectionContext()
        );
        if (operationOwners.size > 200) {
            const oldest = operationOwners.keys().next().value;
            if (oldest) operationOwners.delete(oldest);
        }
    }
    return attempt;
};

const canRecordOperation = (attempt: FileExtractionAttempt): boolean => {
    const owner = operationOwners.get(attempt.operationId);
    const current = getDiagnosticCollectionContext();
    return Boolean(owner?.enabled && current.enabled && owner.identity === current.identity);
};

const safeModel = (
    model: string,
    field: 'model' | 'ocrModel'
): FileExtractionDiagnostic['model' | 'ocrModel'] => {
    const schema = FileExtractionDiagnosticValidator.shape[field];
    const parsed = schema.safeParse(model);
    return parsed.success ? parsed.data : 'unknown';
};

const recordExtraction = (
    attempt: FileExtractionAttempt,
    fileType: FileKind,
    processing?: FileProcessingMetadata,
    failureCode?: ClientFailureCode | 'CONSENT_DENIED',
    statusCode?: number
): void => {
    if (!canRecordOperation(attempt)) return;
    const data = FileExtractionDiagnosticValidator.parse({
        ...attempt,
        fileType,
        stage: processing?.stage ?? 'input',
        outcome: processing?.outcome ?? 'failed',
        code: processing?.code ?? failureCode,
        statusCode,
        ...(processing
            ? {
                  durationMs: processing.durationMs,
                  sizeBucket: processing.sizeBucket,
                  credentialCount: processing.credentialCount,
                  pipelineVersion: processing.pipelineVersion,
                  model: safeModel(processing.model, 'model'),
                  ocrModel: safeModel(processing.ocrModel, 'ocrModel'),
              }
            : {}),
    });
    log.info('file.extraction.completed', data);
};

/** Records only bounded operational fields while the original profile remains eligible. */
export const recordFilePersistenceDiagnostic = (input: {
    attempt: FileExtractionAttempt;
    fileType: string;
    outcome: 'success' | 'failed';
    stage: 'artifact_save' | 'credential_save';
    extractedCount: number;
    selectedCount: number;
    storedCount: number;
}): void => {
    if (!canRecordOperation(input.attempt)) return;
    const parsed = FileExtractionDiagnosticValidator.safeParse({
        ...input.attempt,
        fileType: input.fileType,
        outcome: input.outcome,
        stage: input.stage,
        code:
            input.outcome === 'success'
                ? 'OK'
                : input.stage === 'artifact_save'
                  ? 'ARTIFACT_SAVE_FAILED'
                  : 'CREDENTIAL_SAVE_FAILED',
        extractedCount: input.extractedCount,
        selectedCount: input.selectedCount,
        storedCount: input.storedCount,
    });
    if (parsed.success) log.info('file.persistence.completed', parsed.data);
};

/** Validates the API contract without exposing the response or provider error text. */
export const extractFileCredentials = async (input: {
    did: string;
    file: string;
    fileType: string;
    attempt?: FileExtractionAttempt;
}): Promise<FileExtractionResponse> => {
    const fileType = FILE_KINDS.find(kind => kind === input.fileType);
    if (!fileType) throw new FileExtractionError('INPUT_INVALID');
    const attempt = input.attempt ?? createFileExtractionAttempt();
    if (!FileExtractionAttemptValidator.safeParse(attempt).success) {
        throw new FileExtractionError('INPUT_INVALID');
    }
    let response: Response;
    try {
        response = await aiPassportFetch(
            addActiveLocaleToUrl(`${networkStore.get.aiServiceUrl()}/credentials/parse-file`),
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: input.file,
                    fileType,
                    diagnostics: { ...attempt, enabled: canRecordOperation(attempt) },
                }),
            },
            input.did
        );
    } catch {
        recordExtraction(attempt, fileType, undefined, 'NETWORK_FAILED');
        throw new FileExtractionError('NETWORK_FAILED');
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        recordExtraction(attempt, fileType, undefined, 'RESPONSE_INVALID', response.status);
        throw new FileExtractionError('RESPONSE_INVALID', undefined, response.status);
    }
    const rawProcessing =
        body && typeof body === 'object' && 'processing' in body ? body.processing : undefined;
    const parsedProcessing = FileProcessingMetadataValidator.safeParse(rawProcessing);
    const processing = parsedProcessing.success ? parsedProcessing.data : undefined;
    const matchesRequest =
        processing &&
        processing.operationId === attempt.operationId &&
        processing.attemptId === attempt.attemptId &&
        processing.attempt === attempt.attempt &&
        processing.fileType === fileType;
    if (!response.ok) {
        if (matchesRequest && processing.outcome === 'failed' && processing.stage !== 'complete') {
            recordExtraction(attempt, fileType, processing, undefined, response.status);
            throw new FileExtractionError(processing.code, processing, response.status);
        }
        const code = response.status === 403 ? 'CONSENT_DENIED' : 'RESPONSE_INVALID';
        recordExtraction(attempt, fileType, undefined, code, response.status);
        throw new FileExtractionError(code, undefined, response.status);
    }
    const parsed = FileExtractionResponseValidator.safeParse(body);
    if (!parsed.success || !matchesRequest) {
        recordExtraction(attempt, fileType, undefined, 'RESPONSE_INVALID', response.status);
        throw new FileExtractionError('RESPONSE_INVALID', undefined, response.status);
    }
    recordExtraction(attempt, fileType, parsed.data.processing, undefined, response.status);
    return parsed.data;
};
