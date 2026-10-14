import type {
    ParsedFileCredential,
    RawArtifactCredential,
} from 'learn-card-base/types/file-extraction';

export interface FileUploadOutcome {
    artifact: RawArtifactCredential;
    status: 'review' | 'empty' | 'extraction_failed' | 'save_failed' | 'stored';
    extractionStatus?: 'review' | 'empty' | 'extraction_failed';
    failedStage?: 'artifact_save' | 'credential_save';
    extractedCount: number;
    selectedCount?: number;
    storedCount?: number;
    message?: string;
}

export interface ArtifactProcessingResult {
    credentials: ParsedFileCredential[];
    outcome: FileUploadOutcome;
}

export class FileUploadPersistenceError extends Error {
    constructor(
        readonly stage: 'artifact_save' | 'credential_save',
        message: string
    ) {
        super(message);
        this.name = 'FileUploadPersistenceError';
    }
}
