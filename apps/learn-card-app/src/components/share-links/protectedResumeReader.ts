import type { VC } from '@learncard/types';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { shareWallet } from './shareLinkFlow';
import { getProtectedResumePdf } from '../../helpers/resume-publishing/protectedPdf';
import type { loadProtectedResumePdf } from '../../helpers/resume-publishing/protectedPdf';

type ChunkReader = Parameters<typeof loadProtectedResumePdf>[1];
/** Fetch only a version-bound managed attachment through the configured service. */
export const readProtectedResumeChunk = async (
    request: Parameters<ChunkReader>[0],
    passcode?: string
): Promise<Awaited<ReturnType<ChunkReader>>> => {
    const wallet = shareWallet(await getBespokeLearnCard('a'));
    const hasGrant =
        'accessToken' in request &&
        typeof request.accessToken === 'string' &&
        request.accessToken.length > 0;
    try {
        return await wallet.invoke.getShareLinkAttachmentChunk({
            ...request,
            ...(passcode && !hasGrant ? { passcode } : {}),
        });
    } catch (error) {
        // A grant can expire during a slow request or stop matching after an IP change.
        // Reauthenticate this exact chunk once; all current-share guards still apply.
        const rejection = error as { data?: { code?: string }; code?: string } | null;
        const code = rejection?.data?.code ?? rejection?.code;
        if (!hasGrant || !passcode || code !== 'UNAUTHORIZED') throw error;
        const { id, contentVersion, attachmentId, chunkIndex } = request;
        return wallet.invoke.getShareLinkAttachmentChunk({
            id,
            contentVersion,
            attachmentId,
            chunkIndex,
            passcode,
        });
    }
};

/** Recheck the exact committed version immediately before a local PDF export. */
export const isProtectedResumeCurrent = async (
    credential: VC,
    passcode?: string
): Promise<boolean> => {
    const descriptor = getProtectedResumePdf(credential);
    if (!descriptor) return false;
    const wallet = shareWallet(await getBespokeLearnCard('a'));
    const metadata = await wallet.invoke.resolveShareLink(descriptor.shareId, passcode);
    if (
        metadata.state !== 'active' ||
        metadata.contentVersion !== descriptor.contentVersion ||
        (metadata.expiresAt !== null && Date.parse(metadata.expiresAt) <= Date.now())
    )
        return false;
    return true;
};
