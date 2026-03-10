import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useFilestack, useWallet } from 'learn-card-base';

/**
 * Reference to a credential selected for inclusion in the resume package.
 * `uri` is the wallet storage pointer; the wrapper stores the resolved VC `id` when available.
 */
export type ResumeCredentialRef = {
    uri: string;
    category: string;
};

/**
 * Input payload for publishing a TCP wrapper VC.
 *
 * Notes:
 * - `pdfHash` must be SHA-256 hex for consistency with the wrapper schema.
 * - `wrapperId` can be UUID or full URN UUID; it will be normalized.
 * - `includedCredentials` should represent only credentials intentionally present in the resume.
 * - co-sign flags are MVP placeholders; non-default usage will currently fail at plugin level.
 */
export type PublishTcpResumeInput = {
    pdfBlob: Blob;
    fileName: string;
    pdfHash: string;
    wrapperId?: string;
    includedCredentials: ResumeCredentialRef[];
    generatedAt?: string;
    enableCoSign?: boolean;
    coSignerDid?: string;
};

/**
 * Artifacts returned after successful publish.
 *
 * - `wrapperVc`: signed TrustedCareerProfile VC.
 * - `pdfUrl`: public Filestack URL to the PDF.
 * - `verificationUrl`: app-facing verifier route URL derived from wrapper ID.
 * - `wrapperUri`: LearnCloud URI where wrapper VC is stored.
 */
export type PublishTcpResumeResult = {
    wrapperVc: VC;
    pdfUrl: string;
    verificationUrl: string;
    wrapperUri: string;
};

/**
 * Normalizes wrapper IDs to URI-safe UUID form.
 * - empty => new `urn:uuid:<uuid>`
 * - raw uuid => `urn:uuid:<uuid>`
 * - preformatted value => unchanged
 */
const normalizeWrapperId = (value: string): string => {
    if (!value) return `urn:uuid:${crypto.randomUUID()}`;
    if (value.startsWith('urn:uuid:')) return value;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return `urn:uuid:${value}`;
    }
    return value;
};

/**
 * Builds the verification link surfaced in the post-publish UX.
 * Can be overridden by `VITE_TCP_VERIFICATION_BASE_URL` for staging/preview.
 */
const getVerificationUrl = (wrapperId: string): string => {
    const base = import.meta.env.VITE_TCP_VERIFICATION_BASE_URL || window.location.origin;
    const normalizedBase = `${base}`.replace(/\/+$/, '');
    return `${normalizedBase}/resume/verify/${encodeURIComponent(wrapperId)}`;
};

/**
 * Hook that publishes a TCP resume package end-to-end.
 *
 * Pipeline:
 * 1. Assert wallet has TCP plugin (`invoke.createTcpWrapperVc`).
 * 2. Upload PDF to Filestack for a public immutable URL.
 * 3. Resolve included credential URIs -> stable IDs.
 * 4. Issue wrapper VC signed by active user DID.
 * 5. Store wrapper VC in LearnCloud.
 * 6. Index under `Resume` category and mark previous records superseded.
 *
 * This keeps full resume history: old wrappers remain stored and indexed.
 */
export const useIssueTcpResume = () => {
    const { initWallet } = useWallet();
    const { singleImageUpload } = useFilestack({
        fileType: 'application/pdf',
        onUpload: () => undefined,
    });

    /**
     * Publishes a resume package and returns all generated artifacts.
     *
     * Throws when:
     * - wallet/plugin integration is missing
     * - PDF upload fails
     * - wrapper VC storage fails
     */
    const publishTcpResume = async (
        input: PublishTcpResumeInput
    ): Promise<PublishTcpResumeResult> => {
        const wallet = await initWallet();
        const createTcpWrapperVc = (wallet.invoke as Record<string, unknown>).createTcpWrapperVc;
        if (typeof createTcpWrapperVc !== 'function') {
            throw new Error('TCP wrapper plugin is not available on the active wallet');
        }

        const file = new File([input.pdfBlob], input.fileName, { type: 'application/pdf' });
        const uploader = singleImageUpload as undefined | ((file: File) => Promise<string>);

        if (!uploader) {
            throw new Error('Filestack uploader is unavailable');
        }

        const pdfUrl = await uploader(file);
        if (!pdfUrl) throw new Error('Failed to upload resume PDF to Filestack');

        const wrapperId = normalizeWrapperId(input.wrapperId ?? crypto.randomUUID());
        const generatedAt = input.generatedAt ?? new Date().toISOString();

        const includedCredentials = await Promise.all(
            input.includedCredentials.map(async item => {
                const credential = (await wallet.read.get(item.uri)) as VC | undefined;
                return {
                    id: credential?.id ?? item.uri,
                    category: item.category,
                };
            })
        );

        const wrapperVc = (await (wallet.invoke as any).createTcpWrapperVc({
            learnCard: wallet,
            wrapperId,
            pdfUrl,
            pdfHash: input.pdfHash,
            includedCredentials,
            generatedAt,
            enableCoSign: Boolean(input.enableCoSign),
            coSignerDid: input.coSignerDid,
        })) as VC;

        const wrapperUri = await wallet.store.LearnCloud.uploadEncrypted?.(wrapperVc);
        if (!wrapperUri) {
            throw new Error('Failed to store wrapper VC in LearnCloud');
        }

        const verificationUrl = getVerificationUrl(wrapperId);
        const newRecordId = crypto.randomUUID();
        const existingResumeRecords = await wallet.index.LearnCloud.get({
            category: CredentialCategoryEnum.resume,
        });

        await wallet.index.LearnCloud.add({
            id: newRecordId,
            uri: wrapperUri,
            category: CredentialCategoryEnum.resume,
            credentialId: wrapperVc.id,
            wrapperId,
            pdfUrl,
            pdfHash: input.pdfHash,
            verificationUrl,
            isCurrent: true,
            generatedAt,
        });

        await Promise.all(
            existingResumeRecords.map(record =>
                wallet.index.LearnCloud.update(record.id, {
                    isCurrent: false,
                    supersededBy: wrapperId,
                    supersededAt: generatedAt,
                })
            )
        );

        return { wrapperVc, pdfUrl, verificationUrl, wrapperUri };
    };

    return { publishTcpResume };
};

export default useIssueTcpResume;
