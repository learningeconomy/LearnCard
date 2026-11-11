import { useRef } from 'react';
import { generateShareContentKey, generateShareLinkId } from 'learn-card-base/helpers/share-links';
import { buildAppShareLinkUrl, readShareRecovery } from '../components/share-links/shareLinkFlow';
import { VC } from '@learncard/types';
import { CredentialCategoryEnum, useWallet } from 'learn-card-base';
import { resumeBuilderStore } from '../stores/resumeBuilderStore';
import type { ResumeSectionKey } from '../components/resume-builder/resume-builder.helpers';
import { getResumeBuilderSnapshot } from '../components/resume-builder/resume-builder-history.helpers';
import { asString } from '../components/resume-builder/resume-builder-parsing.helpers';
import { useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore } from 'learn-card-base/stores/walletStore';

import { visibleResumeContact } from '../helpers/resume-publishing/snapshot';
import { buildLerPayloadFromResume, type LerRecordInput } from '../helpers/resume-publishing/ler';
import { captureResumeAccount } from '../helpers/resume-publishing/account';
import {
    prepareProtectedPdf,
    getProtectedResumePdf,
} from '../helpers/resume-publishing/protectedPdf';
import {
    publishManagedResume,
    recoverResumeLink,
    readPendingResumeAddress,
    findOwnedResumeShare,
    discardPendingResumeAttempt,
    ResumePublicationError,
    type ResumePublicationWallet,
} from '../helpers/resume-publishing/publication';
import { enterSharePrivacy } from '../components/share-links/sharePrivacy';
import { getAppBaseUrl } from '../config/bootstrapTenantConfig';
import { environment } from '../config/environment';

/**
 * Reference to a credential selected for inclusion in the generated LER-RS.
 */
export type ResumeCredentialRef = {
    uri: string;
    category: string;
};

/**
 * Input for publishing the exact PDF through an encrypted managed resume link.
 */
export type PublishTcpResumeInput = {
    pdfBlob: Blob;
    fileName: string;
    pdfHash: string;
    includedCredentials: ResumeCredentialRef[];
    generatedAt?: string;
};

/**
 * Artifacts returned after successful publish.
 */
export type PublishTcpResumeResult = {
    lerVc: VC;
    lerUri: string;
    pdfUrl: string;
    shareId: string;
    shareLink: string;
    cleanupWarning?: boolean;
    recoveredAttempt?: boolean;
    snapshot: import('../stores/resumeBuilderStore').ResumeBuilderSnapshot;
};

type CreateLerRecordInvoker = (params: Record<string, unknown>) => Promise<VC>;

/**
 * Publish a signed LER-RS and its protected PDF through the managed share service.
 */
export const useIssueTcpResume = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const reserved = useRef<{ ownerDid: string; recordId?: string; id: string; key: string }>();
    const prepareResumePublicationLink = async (): Promise<string> => {
        enterSharePrivacy();
        const selectedAccount = captureResumeAccount();
        const activeResume = structuredClone(resumeBuilderStore.get.activeResume());
        const wallet = await initWallet();
        if (!selectedAccount()) throw new ResumePublicationError('account');
        const ownerDid = wallet.id.did();
        const isCurrent = () => selectedAccount() && wallet.id.did() === ownerDid;
        const pending = await readPendingResumeAddress(
            wallet as unknown as ResumePublicationWallet,
            isCurrent
        );
        let address = pending;
        if (!address && activeResume?.shareId) {
            const share = await findOwnedResumeShare(
                wallet as unknown as ResumePublicationWallet,
                activeResume.shareId,
                isCurrent
            );
            const recovery = await readShareRecovery(
                wallet as unknown as ResumePublicationWallet,
                share
            );
            address = { id: share.id, key: recovery.latest.key };
        }
        if (
            !address &&
            reserved.current &&
            reserved.current.ownerDid === ownerDid &&
            reserved.current.recordId === activeResume?.recordId
        )
            address = reserved.current;
        if (!address) address = { id: generateShareLinkId(), key: generateShareContentKey() };
        if (!isCurrent()) throw new ResumePublicationError('account');
        reserved.current = { ...address, ownerDid, recordId: activeResume?.recordId };
        return buildAppShareLinkUrl(getAppBaseUrl(), address.id, address.key, environment.DEV);
    };

    const discardPendingResumePublication = async (): Promise<boolean> => {
        enterSharePrivacy();
        const selectedAccount = captureResumeAccount();
        const wallet = await initWallet();
        if (!selectedAccount()) throw new ResumePublicationError('account');
        const did = wallet.id.did();
        const result = await discardPendingResumeAttempt(
            wallet as unknown as ResumePublicationWallet,
            () => selectedAccount() && wallet.id.did() === did
        );
        reserved.current = undefined;
        return result;
    };
    const getResumeShareLink = async (resumeUri: string): Promise<string> => {
        enterSharePrivacy();
        const selectedAccount = captureResumeAccount();
        const wallet = await initWallet();
        if (!selectedAccount()) throw new ResumePublicationError('account');
        const did = wallet.id.did();
        return recoverResumeLink(
            wallet as unknown as ResumePublicationWallet,
            resumeUri,
            getAppBaseUrl(),
            environment.DEV,
            () => selectedAccount() && wallet.id.did() === did
        );
    };
    const publishTcpResume = async (
        input: PublishTcpResumeInput
    ): Promise<PublishTcpResumeResult> => {
        enterSharePrivacy();
        const selectedAccount = captureResumeAccount();
        const snapshot = structuredClone(getResumeBuilderSnapshot());
        const activeResume = structuredClone(resumeBuilderStore.get.activeResume());
        const includedCredentials = input.includedCredentials.map(item => ({ ...item }));
        const switchedDid = switchedProfileStore.get.switchedDid();
        const generatedAt = input.generatedAt ?? new Date().toISOString();
        const wallet = await initWallet();
        if (!selectedAccount()) throw new ResumePublicationError('account');
        const did = wallet.id.did();
        const isCurrent = () => selectedAccount() && wallet.id.did() === did;
        if (
            reserved.current &&
            (reserved.current.ownerDid !== did ||
                reserved.current.recordId !== activeResume?.recordId)
        )
            throw new ResumePublicationError('failed');
        let result;
        try {
            result = await publishManagedResume({
                wallet: wallet as unknown as ResumePublicationWallet,
                isCurrent,
                origin: getAppBaseUrl(),
                development: environment.DEV,
                activeResume,
                snapshot,
                fileName: input.fileName,
                pdfHash: input.pdfHash,
                generatedAt,
                reservedIdentity:
                    reserved.current &&
                    reserved.current.ownerDid === did &&
                    reserved.current.recordId === activeResume?.recordId
                        ? { id: reserved.current.id, key: reserved.current.key }
                        : undefined,
                build: async publicationContext => {
                    const protectedPdf = await prepareProtectedPdf(
                        input.pdfBlob,
                        input.pdfHash,
                        publicationContext
                    );
                    const pdfUrl = asString(protectedPdf.descriptor.url);
                    if (!pdfUrl) throw new ResumePublicationError('failed');
                    if (!isCurrent()) throw new ResumePublicationError('account');
                    const createLerRecord = (wallet.invoke as unknown as Record<string, unknown>)
                        .createLerRecord;
                    if (typeof createLerRecord !== 'function')
                        throw new ResumePublicationError('failed');
                    const lerInputs = await Promise.all(
                        includedCredentials.map(async item => {
                            if (snapshot.hiddenSections[item.category as ResumeSectionKey])
                                throw new ResumePublicationError('failed');
                            const vc = (await wallet.read.get(item.uri)) as VC | undefined;
                            if (!vc || !isCurrent())
                                throw new ResumePublicationError(
                                    !isCurrent() ? 'account' : 'failed'
                                );
                            const selectedEntry = snapshot.credentialEntries[
                                item.category as ResumeSectionKey
                            ]?.find(entry => entry.uri === item.uri);
                            return {
                                uri: item.uri,
                                category: item.category,
                                vc,
                                narrative: selectedEntry?.fields
                                    .find(field => field.type === 'description' && !field.hidden)
                                    ?.value?.trim(),
                                metadata: (selectedEntry?.fields ?? [])
                                    .filter(field => field.type === 'metadata' && !field.hidden)
                                    .map(field => field.value.trim())
                                    .filter(Boolean),
                                current:
                                    item.category === CredentialCategoryEnum.workHistory
                                        ? snapshot.currentJobCredentialUri === item.uri
                                        : undefined,
                                startDateOverride: snapshot.credentialStartDates[item.uri],
                                endDateOverride: snapshot.credentialEndDates[item.uri],
                            } satisfies LerRecordInput;
                        })
                    );
                    const lerPayload = buildLerPayloadFromResume(lerInputs, {
                        did,
                        ...visibleResumeContact(snapshot),
                        pdfUrl,
                        pdfAttachment: protectedPdf.descriptor,
                        pdfHash: input.pdfHash,
                        generatedAt,
                    });
                    const lerVc = await (createLerRecord as CreateLerRecordInvoker)({
                        learnCard: wallet,
                        ...lerPayload,
                    });
                    if (!isCurrent()) throw new ResumePublicationError('account');
                    const signedAttachment = getProtectedResumePdf(lerVc);
                    if (
                        !signedAttachment ||
                        signedAttachment.shareId !== publicationContext.shareId ||
                        signedAttachment.contentVersion !== publicationContext.contentVersion ||
                        signedAttachment.attachmentId !== protectedPdf.attachment.id ||
                        signedAttachment.chunkCount !== protectedPdf.attachment.chunkCount ||
                        signedAttachment.byteLength !== input.pdfBlob.size ||
                        signedAttachment.hash !== input.pdfHash ||
                        signedAttachment.key !== asString(protectedPdf.descriptor.key)
                    )
                        throw new ResumePublicationError('failed');
                    return {
                        lerVc,
                        pdfUrl,
                        attachment: protectedPdf.attachment,
                        chunks: protectedPdf.chunks,
                    };
                },
            });
        } catch (error) {
            if (
                error instanceof ResumePublicationError &&
                error.code === 'failed' &&
                !error.canDiscard
            )
                reserved.current = undefined;
            throw error;
        }
        if (!isCurrent()) throw new ResumePublicationError('account');
        const nextActiveResume = {
            recordId: result.recordId,
            uri: result.lerUri,
            lerRecordId: result.lerVc.id || result.recordId,
            generatedAt: result.generatedAt,
            fileName: result.fileName,
            shareId: result.shareId,
        };
        if (result.recoveredAttempt)
            resumeBuilderStore.set.hydrateStore(result.snapshot, nextActiveResume);
        else resumeBuilderStore.set.setActiveResume(nextActiveResume);
        await Promise.all(
            [
                ['existing-resumes', switchedDid ?? ''],
                ['useGetCredentialList', switchedDid ?? '', CredentialCategoryEnum.resume],
                ['useGetCredentials', switchedDid ?? '', CredentialCategoryEnum.resume],
            ].map(queryKey => queryClient.invalidateQueries({ queryKey }).catch(() => undefined))
        );
        if (!isCurrent()) throw new ResumePublicationError('account');
        return result;
    };
    return {
        publishTcpResume,
        getResumeShareLink,
        prepareResumePublicationLink,
        discardPendingResumePublication,
    };
};
export default useIssueTcpResume;
