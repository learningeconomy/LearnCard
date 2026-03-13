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

import {
    getResumeBuilderSnapshotKey,
    resumeBuilderStore,
    type ResumeBuilderSnapshot,
} from '../../stores/resumeBuilderStore';
import type { ExistingResume } from '../../hooks/useExistingResumes';
import { buildResumeHydrationState } from './resume-builder-history.helpers';

import { VC } from '@learncard/types';

export const ResumeBuilder: React.FC = () => {
    useResumePreselection();

    const { newModal, closeModal } = useModal({ mobile: ModalTypes.FullScreen });
    const resumePreviewRef = useRef<ResumePreviewHandle>(null);
    const { isMobile } = useDeviceTypeByWidth();
    const { initWallet } = useWallet();

    const [panelOpen, setPanelOpen] = useState<boolean>(true); // Desktop side panel
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false); // Mobile drawer

    const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
    const [inlinePreview, setInlinePreview] = useState<ResumePdfPreviewData | null>(null);
    const [isHydratingResume, setIsHydratingResume] = useState<boolean>(false);

    const [loadingAction, setLoadingAction] = useState<ResumeBuilderHeaderAction>(null);
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
    const { publishTcpResume } = useIssueTcpResume();
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

    const handlePreview = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('preview');
        try {
            const nextPreview = await resumePreviewRef.current?.createPDFPreviewUrl();
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
        try {
            await resumePreviewRef.current?.generatePDF();
        } finally {
            setLoadingAction(null);
        }
    }, [loadingAction]);

    const handlePublish = useCallback(async () => {
        if (loadingAction) return;
        setLoadingAction('publish');
        try {
            const artifact = await resumePreviewRef.current?.createPDFArtifact();
            if (!artifact) {
                presentToast('Could not generate a PDF artifact for publishing.', {
                    type: ToastTypeEnum.Error,
                });
                return;
            }

            const includedCredentials = Object.entries(credentialEntries).flatMap(
                ([category, entries]) =>
                    (hiddenSections?.[category as CredentialCategoryEnum] ? [] : entries ?? []).map(
                        entry => ({
                            uri: entry.uri,
                            category: category || CredentialCategoryEnum.workHistory,
                        })
                    )
            );

            const { lerVc } = await publishTcpResume({
                pdfBlob: artifact.blob,
                fileName: artifact.fileName,
                pdfHash: artifact.hash,
                includedCredentials,
            });

            if (activeResume?.recordId) {
                setBaselineSnapshotByResume({
                    recordId: activeResume.recordId,
                    snapshotKey: currentSnapshotKey,
                });
            }

            presentToast('LER-RS resume credential published successfully.', {
                title: 'Published',
                details: lerVc?.id || undefined,
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
                duration: 6000,
            });
        } catch (error: any) {
            presentToast(error?.message ?? 'Failed to publish LER-RS resume credential.', {
                title: 'Publish Failed',
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setLoadingAction(null);
        }
    }, [
        activeResume?.recordId,
        credentialEntries,
        currentSnapshotKey,
        hiddenSections,
        loadingAction,
        presentToast,
        publishTcpResume,
    ]);

    const openResumeConfigPanel = () => {
        if (isMobile) {
            newModal(
                <ResumeConfigOverlayPanel drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen} />
            );
        } else {
            setPanelOpen(true);
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

                resumeBuilderStore.set.hydrateStore(snapshot, nextActiveResume);
                setBaselineSnapshotByResume({
                    recordId: nextActiveResume.recordId,
                    snapshotKey: getResumeBuilderSnapshotKey(snapshot),
                });
                closeInlinePreview();
                presentToast('Loaded resume into edit mode.', {
                    type: ToastTypeEnum.Success,
                });
            } catch (error: any) {
                presentToast(error?.message ?? 'Failed to load selected resume.', {
                    type: ToastTypeEnum.Error,
                });
            } finally {
                setIsHydratingResume(false);
            }
        },
        [closeInlinePreview, initWallet, presentToast]
    );

    const handleCreateNewResume = useCallback(() => {
        resumeBuilderStore.set.resetStore();
        closeInlinePreview();
        setBaselineSnapshotByResume(null);
        presentToast('Started a new resume draft.', {
            type: ToastTypeEnum.Success,
        });
    }, [closeInlinePreview, presentToast]);

    const handleShareCurrentResume = useCallback(() => {
        if (!activeResumeVc || !activeResume?.uri) {
            presentToast('This resume is not available to share yet.', {
                type: ToastTypeEnum.Error,
            });
            return;
        }

        newModal(
            <ResumeShareLink
                resume={activeResumeVc as VC}
                resumeUri={activeResume.uri}
                handleClose={() => closeModal()}
            />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [activeResume?.uri, activeResumeVc, newModal, presentToast, closeModal]);

    return (
        <div className="resume-builder flex h-full w-full bg-grayscale-50 overflow-hidden relative">
            {(loadingAction || isHydratingResume) && (
                <div className="absolute inset-0 h-full w-full z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <ResumeBuilderLoader />
                </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col">
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
                    disablePublish={Boolean(activeResume) ? !hasUnsavedChanges : false}
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

export default ResumeBuilder;
