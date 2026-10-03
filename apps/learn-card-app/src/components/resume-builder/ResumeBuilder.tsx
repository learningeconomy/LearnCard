import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

import { IonIcon } from '@ionic/react';
import { menuOutline } from 'ionicons/icons';
import ResumeIframePreview from './ResumeIframePreview';
import ResumeBuilderLoader from './ResumeBuilderLoader';
import ResumeShareLink from './ResumeShareLink';
import ResumeConfigPanelFAB from './resume-config-panel/ResumeConfigPanelFAB';
import ResumePreview, { ResumePreviewHandle } from './resume-preview/ResumePreview';
import ResumeConfigOverlayPanel from './resume-config-panel/ResumeConfigOverlayPanel';
import ResumeConfigDesktopSidePanel from './resume-config-panel/ResumeConfigDesktopSidePanel';
import ResumeBuilderHeader, { ResumeBuilderHeaderAction } from './ResumeBuilderHeader';

import { ResumePdfPreviewData } from './resume-preview/useResumePdf';

import {
    useDeviceTypeByWidth,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
    CredentialCategoryEnum,
    useGetResolvedCredential,
    useWallet,
} from 'learn-card-base';
import { useResumePreselection } from './useResumePreselection';
import { useIssueTcpResume } from '../../hooks/useIssueTcpResume';
import { enterSharePrivacy } from '../share-links/sharePrivacy';
import { resumePublicationErrorMessage } from './resumePublicationMessages';
import {
    captureResumeAccount,
    useResumeAccountRevision,
} from '../../helpers/resume-publishing/account';
import { downloadProtectedResumePdf } from '../../helpers/resume-publishing/protectedPdf';
import {
    readProtectedResumeChunk,
    isProtectedResumeCurrent,
} from '../share-links/protectedResumeReader';

import {
    getResumeBuilderSnapshotKey,
    resumeBuilderStore,
    type ResumeBuilderSnapshot,
} from '../../stores/resumeBuilderStore';
import type { ExistingResume } from '../../hooks/useExistingResumes';
import { buildResumeHydrationState } from './resume-builder-history.helpers';
import type { ResumeSectionKey } from './resume-builder.helpers';

import { VC } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

const ResumeBuilderContent: React.FC = () => {
    enterSharePrivacy();
    useResumePreselection();

    const { newModal, closeModal } = useModal({ mobile: ModalTypes.FullScreen });
    const resumePreviewRef = useRef<ResumePreviewHandle>(null);
    const { isMobile } = useDeviceTypeByWidth();
    const { initWallet } = useWallet();

    const [panelOpen, setPanelOpen] = useState<boolean>(true); // Desktop side panel
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false); // Mobile drawer
    const [credentialFocusRequest, setCredentialFocusRequest] = useState<{
        sectionKey: ResumeSectionKey;
        requestId: number;
    } | null>(null);

    const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
    const [inlinePreview, setInlinePreview] = useState<ResumePdfPreviewData | null>(null);
    const [isHydratingResume, setIsHydratingResume] = useState<boolean>(false);

    const [loadingAction, setLoadingAction] = useState<ResumeBuilderHeaderAction>(null);
    const [canDiscardSetup, setCanDiscardSetup] = useState(false);
    const [pendingSetup, setPendingSetup] = useState(false);
    const [resumeQrCodeLink, setResumeQrCodeLink] = useState<string>('');
    const credentialEntries = resumeBuilderStore.useTracked.credentialEntries();
    const hiddenSections = resumeBuilderStore.useTracked.hiddenSections();
    const activeResume = resumeBuilderStore.useTracked.activeResume();
    const personalDetails = resumeBuilderStore.useTracked.personalDetails();
    const hiddenPersonalDetails = resumeBuilderStore.useTracked.hiddenPersonalDetails();
    const currentJobCredentialUri = resumeBuilderStore.useTracked.currentJobCredentialUri();
    const credentialStartDates = resumeBuilderStore.useTracked.credentialStartDates();
    const credentialEndDates = resumeBuilderStore.useTracked.credentialEndDates();
    const documentSetup = resumeBuilderStore.useTracked.documentSetup();
    const sectionOrder = resumeBuilderStore.useTracked.sectionOrder();
    const { presentToast } = useToast();
    const {
        publishTcpResume,
        getResumeShareLink,
        prepareResumePublicationLink,
        discardPendingResumePublication,
    } = useIssueTcpResume();
    const { data: activeResumeVc } = useGetResolvedCredential(
        activeResume?.uri ?? '',
        Boolean(activeResume?.uri)
    );
    const [baselineSnapshotByResume, setBaselineSnapshotByResume] = useState<{
        recordId: string;
        snapshotKey: string;
    } | null>(null);

    const currentSnapshot = useMemo<ResumeBuilderSnapshot>(
        () => ({
            personalDetails,
            hiddenPersonalDetails,
            hiddenSections,
            currentJobCredentialUri,
            credentialStartDates,
            credentialEndDates,
            documentSetup,
            credentialEntries,
            sectionOrder,
        }),
        [
            credentialEndDates,
            credentialEntries,
            credentialStartDates,
            currentJobCredentialUri,
            documentSetup,
            hiddenPersonalDetails,
            hiddenSections,
            personalDetails,
            sectionOrder,
        ]
    );
    const currentSnapshotKey = useMemo(
        () => getResumeBuilderSnapshotKey(currentSnapshot),
        [currentSnapshot]
    );
    const hasUnsavedChanges =
        Boolean(activeResume?.recordId) &&
        baselineSnapshotByResume?.recordId === activeResume?.recordId &&
        baselineSnapshotByResume?.snapshotKey !== currentSnapshotKey;

    const revokePreviewBlobUrl = useCallback((preview: ResumePdfPreviewData | null) => {
        if (preview?.downloadUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(preview.downloadUrl);
        }
    }, []);

    const openResumeShareModal = useCallback(
        (resume: VC, resumeUri: string, committedLink?: string) => {
            newModal(
                <ResumeShareLink
                    resume={resume}
                    resumeUri={resumeUri}
                    committedLink={committedLink}
                    handleClose={() => closeModal()}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        },
        [closeModal, newModal]
    );

    const waitForUiUpdate = useCallback(
        () =>
            new Promise<void>(resolve => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            }),
        []
    );

    const publishCurrentResume = useCallback(
        async ({
            openShareModalAfterSave = true,
            successToastTitle = m['passport.resumeBuilder.toastTitle.published'](),
        }: {
            openShareModalAfterSave?: boolean;
            successToastTitle?: string;
        }) => {
            const isCurrentAccount = captureResumeAccount();
            const snapshotKey = currentSnapshotKey;
            const reservedLink = await prepareResumePublicationLink();
            if (!isCurrentAccount()) throw { code: 'account' };
            setResumeQrCodeLink(reservedLink);
            await waitForUiUpdate();
            const artifact = await resumePreviewRef.current?.createPDFArtifact();
            if (!isCurrentAccount()) throw { code: 'account' };
            if (!artifact) {
                throw new Error('Resume artifact unavailable');
            }

            if (
                snapshotKey !==
                getResumeBuilderSnapshotKey({
                    personalDetails: resumeBuilderStore.get.personalDetails(),
                    hiddenPersonalDetails: resumeBuilderStore.get.hiddenPersonalDetails(),
                    hiddenSections: resumeBuilderStore.get.hiddenSections(),
                    currentJobCredentialUri: resumeBuilderStore.get.currentJobCredentialUri(),
                    credentialStartDates: resumeBuilderStore.get.credentialStartDates(),
                    credentialEndDates: resumeBuilderStore.get.credentialEndDates(),
                    documentSetup: resumeBuilderStore.get.documentSetup(),
                    credentialEntries: resumeBuilderStore.get.credentialEntries(),
                    sectionOrder: resumeBuilderStore.get.sectionOrder(),
                })
            )
                throw { code: 'changed' };

            const includedCredentials = Object.entries(credentialEntries).flatMap(
                ([category, entries]) =>
                    (hiddenSections?.[category as ResumeSectionKey] ? [] : (entries ?? [])).map(
                        entry => ({
                            uri: entry.uri,
                            category: category || CredentialCategoryEnum.workHistory,
                        })
                    )
            );

            const {
                lerVc,
                lerUri,
                shareLink,
                cleanupWarning,
                recoveredAttempt,
                snapshot: publishedSnapshot,
            } = await publishTcpResume({
                pdfBlob: artifact.blob,
                fileName: artifact.fileName,
                pdfHash: artifact.hash,
                includedCredentials,
            });

            if (!isCurrentAccount()) throw { code: 'account' };
            setPendingSetup(false);
            setCanDiscardSetup(false);
            setResumeQrCodeLink(shareLink);
            if (cleanupWarning)
                presentToast(m['resumePublishing.cleanup'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });

            if (activeResume?.recordId) {
                setBaselineSnapshotByResume({
                    recordId: activeResume.recordId,
                    snapshotKey: getResumeBuilderSnapshotKey(publishedSnapshot),
                });
            }

            presentToast(
                recoveredAttempt
                    ? m['resumePublishing.recovered']()
                    : m['toasts.resume.publishedSuccess'](),
                {
                    title: successToastTitle,
                    type: ToastTypeEnum.Success,
                    hasDismissButton: true,
                    duration: 6000,
                }
            );

            if (openShareModalAfterSave) {
                openResumeShareModal(lerVc, lerUri, shareLink);
            }

            return { lerVc, lerUri, shareLink };
        },
        [
            activeResume?.recordId,
            credentialEntries,
            currentSnapshotKey,
            documentSetup?.showQRCode,
            hiddenSections,
            openResumeShareModal,
            presentToast,
            publishTcpResume,
            prepareResumePublicationLink,
            waitForUiUpdate,
        ]
    );

    const handlePreview = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('preview');
        const isCurrentAccount = captureResumeAccount();
        try {
            const nextPreview = await resumePreviewRef.current?.createPDFPreviewUrl();
            if (!isCurrentAccount()) {
                revokePreviewBlobUrl(nextPreview ?? null);
                return;
            }
            if (nextPreview) {
                setInlinePreview(prevPreview => {
                    revokePreviewBlobUrl(prevPreview);
                    return nextPreview;
                });
            }
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction, revokePreviewBlobUrl]);

    const handleDownload = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('download');
        const isCurrentAccount = captureResumeAccount();
        try {
            let savedResumeForShare: { lerVc: VC; lerUri: string; shareLink: string } | null = null;
            if (documentSetup?.showQRCode) {
                const publishResult = await publishCurrentResume({
                    openShareModalAfterSave: false,
                    successToastTitle: m['passport.resumeBuilder.toastTitle.saved'](),
                });
                savedResumeForShare = {
                    lerVc: publishResult.lerVc,
                    lerUri: publishResult.lerUri,
                    shareLink: publishResult.shareLink,
                };
                await waitForUiUpdate();
            }
            if (savedResumeForShare) {
                await downloadProtectedResumePdf(
                    savedResumeForShare.lerVc,
                    documentSetup.fileName,
                    async () => {
                        return (
                            isCurrentAccount() &&
                            (await isProtectedResumeCurrent(savedResumeForShare.lerVc)) &&
                            isCurrentAccount()
                        );
                    },
                    readProtectedResumeChunk
                );
            } else {
                await resumePreviewRef.current?.generatePDF();
            }
            if (!isCurrentAccount()) return;
            if (savedResumeForShare) {
                openResumeShareModal(
                    savedResumeForShare.lerVc,
                    savedResumeForShare.lerUri,
                    savedResumeForShare.shareLink
                );
            }
            presentToast(m['toasts.resume.downloadSuccess'](), {
                title: m['passport.resumeBuilder.toastTitle.downloaded'](),
                type: ToastTypeEnum.Success,
            });
        } catch (error: unknown) {
            const disposable =
                typeof error === 'object' &&
                error !== null &&
                'canDiscard' in error &&
                error.canDiscard === true;
            setCanDiscardSetup(disposable);
            setPendingSetup(
                disposable ||
                    (typeof error === 'object' &&
                        error !== null &&
                        'code' in error &&
                        error.code === 'pending')
            );
            presentToast(resumePublicationErrorMessage(error), {
                title: m['passport.resumeBuilder.toastTitle.downloadFailed'](),
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLoadingAction(null);
        }
    }, [
        documentSetup?.showQRCode,
        documentSetup.fileName,
        loadingAction,
        openResumeShareModal,
        presentToast,
        publishCurrentResume,
        waitForUiUpdate,
    ]);

    const handlePublish = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('publish');
        try {
            await publishCurrentResume({
                openShareModalAfterSave: true,
                successToastTitle: activeResume?.recordId
                    ? m['passport.resumeBuilder.toastTitle.saved']()
                    : m['passport.resumeBuilder.toastTitle.published'](),
            });
        } catch (error: unknown) {
            const disposable =
                typeof error === 'object' &&
                error !== null &&
                'canDiscard' in error &&
                error.canDiscard === true;
            setCanDiscardSetup(disposable);
            setPendingSetup(
                disposable ||
                    (typeof error === 'object' &&
                        error !== null &&
                        'code' in error &&
                        error.code === 'pending')
            );
            presentToast(resumePublicationErrorMessage(error), {
                title: m['passport.resumeBuilder.toastTitle.publishFailed'](),
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction, presentToast, publishCurrentResume, activeResume?.recordId]);

    const openResumeConfigPanel = (focusSectionKey?: ResumeSectionKey) => {
        const focusRequestId = focusSectionKey ? Date.now() : undefined;

        if (isMobile) {
            newModal(
                <ResumeConfigOverlayPanel
                    drawerOpen={drawerOpen}
                    setDrawerOpen={setDrawerOpen}
                    focusSectionKey={focusSectionKey}
                    focusRequestId={focusRequestId}
                />
            );
        } else {
            setPanelOpen(true);
            setCredentialFocusRequest(
                focusSectionKey && focusRequestId
                    ? { sectionKey: focusSectionKey, requestId: focusRequestId }
                    : null
            );
        }
    };

    const previewWrapperStyles = isMobile
        ? 'flex-1 overflow-y-auto py-6 px-3 flex flex-col'
        : 'flex-1 overflow-y-auto py-10 px-6 flex justify-center';

    useEffect(() => {
        return () => {
            revokePreviewBlobUrl(inlinePreview);
        };
    }, [inlinePreview, revokePreviewBlobUrl]);

    const closeInlinePreview = useCallback(() => {
        setInlinePreview(prevPreview => {
            revokePreviewBlobUrl(prevPreview);
            return null;
        });
    }, [revokePreviewBlobUrl]);

    useEffect(() => {
        if (!activeResume?.recordId) {
            setBaselineSnapshotByResume(null);
            return;
        }

        setBaselineSnapshotByResume(prev => {
            if (prev?.recordId === activeResume.recordId) return prev;
            return {
                recordId: activeResume.recordId,
                snapshotKey: currentSnapshotKey,
            };
        });
    }, [activeResume?.recordId, currentSnapshotKey]);

    const handleSelectResume = useCallback(
        async (resume: ExistingResume) => {
            setIsHydratingResume(true);
            const isCurrentAccount = captureResumeAccount();
            try {
                const wallet = await initWallet();
                const { snapshot, activeResume: nextActiveResume } =
                    await buildResumeHydrationState(resume, async uri => {
                        try {
                            return (await wallet.read.get(uri)) as VC;
                        } catch {
                            return null;
                        }
                    });

                if (!isCurrentAccount()) return;
                resumeBuilderStore.set.hydrateStore(snapshot, nextActiveResume);
                setBaselineSnapshotByResume({
                    recordId: nextActiveResume.recordId,
                    snapshotKey: getResumeBuilderSnapshotKey(snapshot),
                });
                closeInlinePreview();
                setResumeQrCodeLink('');
                if (nextActiveResume.uri) {
                    try {
                        const link = await getResumeShareLink(nextActiveResume.uri);
                        if (isCurrentAccount()) setResumeQrCodeLink(link);
                    } catch {
                        /* Legacy resumes can still be edited and republished explicitly. */
                    }
                }
                if (!isCurrentAccount()) return;
                presentToast(m['toasts.resume.loadedEditMode'](), {
                    type: ToastTypeEnum.Success,
                });
            } catch (error: unknown) {
                presentToast(m['toasts.resume.loadFailed'](), {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setIsHydratingResume(false);
            }
        },
        [closeInlinePreview, getResumeShareLink, initWallet, presentToast]
    );

    const handleCreateNewResume = useCallback(() => {
        if (pendingSetup) {
            presentToast(m['resumePublishing.pending'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return;
        }
        resumeBuilderStore.set.resetStore();
        closeInlinePreview();
        setResumeQrCodeLink('');
        setBaselineSnapshotByResume(null);
        presentToast(m['toasts.resume.newDraft'](), {
            type: ToastTypeEnum.Success,
        });
    }, [closeInlinePreview, presentToast, pendingSetup]);

    const handleDiscardSetup = useCallback(async () => {
        if (loadingAction || !canDiscardSetup) return;
        const isCurrentAccount = captureResumeAccount();
        setLoadingAction('publish');
        try {
            const cleared = await discardPendingResumePublication();
            if (!isCurrentAccount()) return;
            if (!cleared) {
                presentToast(m['resumePublishing.discardFailed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                return;
            }
            setCanDiscardSetup(false);
            setPendingSetup(false);
            setResumeQrCodeLink('');
            presentToast(m['resumePublishing.discarded'](), {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (error: unknown) {
            if (isCurrentAccount())
                presentToast(resumePublicationErrorMessage(error), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
        } finally {
            setLoadingAction(null);
        }
    }, [canDiscardSetup, discardPendingResumePublication, loadingAction, presentToast]);

    const handleShareCurrentResume = useCallback(() => {
        if (!activeResumeVc || !activeResume?.uri) {
            presentToast(m['toasts.resume.notAvailableToShare'](), {
                type: ToastTypeEnum.Error,
            });
            return;
        }

        openResumeShareModal(activeResumeVc as VC, activeResume.uri);
    }, [activeResume?.uri, activeResumeVc, openResumeShareModal, presentToast]);

    return (
        <div
            className="resume-builder sentry-block ph-no-capture flex h-full w-full bg-grayscale-100 overflow-hidden relative"
            data-feedback-exclude
        >
            {(loadingAction || isHydratingResume) && (
                <div className="absolute inset-0 h-full w-full z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <ResumeBuilderLoader />
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col">
                {canDiscardSetup && (
                    <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 space-y-3">
                        <p className="text-sm text-grayscale-700">
                            {m['resumePublishing.interrupted']()}
                        </p>
                        <button
                            type="button"
                            onClick={() => void handleDiscardSetup()}
                            disabled={Boolean(loadingAction)}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 bg-white text-grayscale-700 text-sm font-medium disabled:opacity-40"
                        >
                            {loadingAction
                                ? m['resumePublishing.discarding']()
                                : m['resumePublishing.discard']()}
                        </button>
                    </div>
                )}
                <p className="bg-white px-6 py-3 text-xs text-grayscale-600">
                    {m['resumePublishing.republishLimits']()}
                </p>
                <p className="bg-white px-6 py-3 text-xs text-grayscale-600">
                    {m['resumePublishing.originalClaims']()}
                </p>
                <ResumeBuilderHeader
                    loadingAction={loadingAction}
                    isMobile={isMobile}
                    isDesktopPanelClosed={!panelOpen}
                    onPreview={handlePreview}
                    onDownload={handleDownload}
                    onPublish={handlePublish}
                    onShareCurrentResume={
                        activeResumeVc && activeResume?.uri ? handleShareCurrentResume : undefined
                    }
                    disableShareCurrentResume={hasUnsavedChanges}
                    disablePublish={activeResume ? !hasUnsavedChanges : false}
                    onSelectResume={handleSelectResume}
                    onCreateNewResume={handleCreateNewResume}
                    activeResumeRecordId={activeResume?.recordId}
                    isEditingExistingResume={Boolean(activeResume)}
                />

                <div className={previewWrapperStyles}>
                    <ResumePreview
                        ref={resumePreviewRef}
                        isMobile={isMobile}
                        isPreviewing={isPreviewing}
                        qrCodeValue={resumeQrCodeLink}
                        onOpenCredentialPanel={openResumeConfigPanel}
                    />
                </div>
            </div>

            <ResumeIframePreview preview={inlinePreview} onClose={closeInlinePreview} />

            {/* ── Desktop side panel ── */}
            {!isMobile && (
                <ResumeConfigDesktopSidePanel
                    panelOpen={panelOpen}
                    setPanelOpen={setPanelOpen}
                    isPreviewing={isPreviewing}
                    setIsPreviewing={setIsPreviewing}
                    focusSectionKey={credentialFocusRequest?.sectionKey}
                    focusRequestId={credentialFocusRequest?.requestId}
                />
            )}

            {/* ── Mobile FABs ── */}
            {isMobile && !drawerOpen && (
                <>
                    <ResumeConfigPanelFAB openResumeConfigPanel={openResumeConfigPanel} />
                </>
            )}

            {/* ── Desktop panel button when closed ── */}
            {!isMobile && !panelOpen && (
                <button
                    onClick={() => openResumeConfigPanel()}
                    className="absolute top-4 right-4 z-20 bg-white border border-grayscale-200 shadow-sm rounded-full p-2 h-[40px] w-[40px] text-grayscale-600 hover:text-grayscale-900"
                >
                    <IonIcon icon={menuOutline} className="w-[20px] h-[20px]" />
                </button>
            )}
        </div>
    );
};

export const ResumeBuilder: React.FC = () => {
    const revision = useResumeAccountRevision();
    return <ResumeBuilderContent key={revision} />;
};
export default ResumeBuilder;
