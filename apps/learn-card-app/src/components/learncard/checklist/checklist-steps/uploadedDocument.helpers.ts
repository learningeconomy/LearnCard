import { RawArtifactCredentialValidator } from 'learn-card-base/types/file-extraction-credentials';
import type { RawArtifactCredential } from 'learn-card-base/types/file-extraction';
import { getLogger } from 'learn-card-base/logging/logger';

const log = getLogger('uploaded-document');

type DocumentRecord = { id: string; uri: string };

export type UploadedDocument = RawArtifactCredential['rawArtifact'] &
    DocumentRecord & { artifactId: string; unavailable: boolean };

/** Retain index identity so an unreadable original can still be removed. */
export const readUploadedDocument = async (
    record: DocumentRecord,
    read: (uri: string) => Promise<unknown>,
    type: string
): Promise<UploadedDocument> => {
    let payload: unknown;
    try {
        payload = await read(record.uri);
    } catch {
        // A failed read becomes the same removable placeholder as malformed legacy data.
    }
    const credential = payload && typeof payload === 'object' ? payload : undefined;
    const artifact = RawArtifactCredentialValidator.shape.rawArtifact.safeParse(
        credential && 'rawArtifact' in credential ? credential.rawArtifact : undefined
    );
    const artifactId =
        credential && 'id' in credential && typeof credential.id === 'string' && credential.id
            ? credential.id
            : record.id;
    if (!artifact.success) {
        log.warn('file.document_unavailable');
        return {
            ...record,
            artifactId,
            type,
            fileName: '',
            fileSize: '',
            fileType: '',
            data: '',
            unavailable: true,
        };
    }
    return { ...artifact.data, ...record, artifactId, type, unavailable: false };
};
