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
    return wallet.invoke.getShareLinkAttachmentChunk({
        ...request,
        ...(passcode && !hasGrant ? { passcode } : {}),
    });
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
    return metadata.expiresAt === null || Date.parse(metadata.expiresAt) > Date.now();
};
