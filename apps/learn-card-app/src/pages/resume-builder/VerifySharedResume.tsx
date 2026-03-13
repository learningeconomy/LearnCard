import React, { useCallback, useEffect, useRef, useState } from 'react';
import queryString from 'query-string';

import {
    IonContent,
    IonHeader,
    IonPage,
    IonSpinner,
    IonToolbar,
    useIonModal,
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { VC, VerificationItem, VP } from '@learncard/types';

import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { ToastTypeEnum, useDeviceTypeByWidth, useToast } from 'learn-card-base';
import DownloadIcon from 'learn-card-base/svgs/DownloadIcon';

import ResumePreview, {
    ResumePreviewHandle,
} from '../../components/resume-builder/resume-preview/ResumePreview';
import SharedBoostVerificationBlock, {
    SharedBoostVerificationBlockViewMode,
} from '../../components/creds-bundle/SharedBoostVerificationBlock';
import {
    buildResumeBuilderSnapshotFromLerVc,
    getEmbeddedVerificationCredentialsByIdFromLerVc,
    getResumeBuilderSnapshot,
} from '../../components/resume-builder/resume-builder-history.helpers';
import {
    buildResumeMetadataVerificationItems,
    filterOutBoostVerificationItems,
    getResumeSubjectDid,
    mapLerVerificationResultToItems,
    type LerVerificationResultLike,
} from './shared-resume.helpers';
import { resumeBuilderStore } from '../../stores/resumeBuilderStore';

const getQueryParam = (value: string | string[] | null): string => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
};

const VerifySharedResume: React.FC = () => {
    const { isMobile } = useDeviceTypeByWidth();
    const { presentToast } = useToast();
    const location = useLocation();
    const resumePreviewRef = useRef<ResumePreviewHandle>(null);
    const { uri: rawUriParam, seed: seedParam, pin: pinParam } = queryString.parse(location.search);
    const rawUri = getQueryParam(rawUriParam);
    const seed = getQueryParam(seedParam);
    const pin = getQueryParam(pinParam);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [resumeCredential, setResumeCredential] = useState<VC | null>(null);
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const [downloadingResume, setDownloadingResume] = useState(false);
    const [resolvedCredentialsByUri, setResolvedCredentialsByUri] = useState<
        Record<string, VC | null>
    >({});

    const [presentVerificationModal, dismissVerificationModal] = useIonModal(
        SharedBoostVerificationBlock,
        {
            handleCloseModal: () => dismissVerificationModal(),
            mode: SharedBoostVerificationBlockViewMode.modal,
            verificationItems,
            boost: resumeCredential as VC,
        }
    );

    const handleDownloadResume = useCallback(async () => {
        if (downloadingResume) return;
        setDownloadingResume(true);

        try {
            if (!resumePreviewRef.current) {
                throw new Error('Resume preview is not ready yet.');
            }
            await resumePreviewRef.current.generatePDF();
            presentToast('Resume downloaded successfully.', {
                title: 'Downloaded',
                type: ToastTypeEnum.Success,
            });
        } catch (error: any) {
            presentToast(error?.message ?? 'Failed to download resume.', {
                title: 'Download Failed',
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setDownloadingResume(false);
        }
    }, [downloadingResume, presentToast]);

    useEffect(() => {
        const previousSnapshot = getResumeBuilderSnapshot();
        const previousActiveResume = resumeBuilderStore.get.activeResume();
        let isCancelled = false;

        setLoading(true);
        setError('');
        setResumeCredential(null);
        setVerificationItems([]);
        setResolvedCredentialsByUri({});

        const fetchSharedResume = async () => {
            if (!rawUri || !seed || !pin) {
                setError('This resume link is missing required share parameters.');
                setLoading(false);
                return;
            }

            try {
                const sharedWallet = await getBespokeLearnCard(`${seed}${pin}`);
                const resolvedPresentation = (await sharedWallet.read.get(
                    String(rawUri).replace('localhost:', 'localhost%3A')
                )) as VP;

                const firstCredential = Array.isArray(resolvedPresentation?.verifiableCredential)
                    ? (resolvedPresentation.verifiableCredential[0] as VC | undefined)
                    : (resolvedPresentation?.verifiableCredential as VC | undefined);

                if (!firstCredential) {
                    throw new Error('No resume credential was found in this presentation.');
                }

                const verifyLerPresentation = (sharedWallet?.invoke as Record<string, unknown>)
                    ?.verifyLerPresentation;
                const verifyLerVP = (sharedWallet?.invoke as Record<string, unknown>)?.verifyLerVP;

                let boostLikeVerifications: VerificationItem[] = [];
                if (
                    typeof verifyLerVP === 'function' ||
                    typeof verifyLerPresentation === 'function'
                ) {
                    const lerVerification = await (
                        (verifyLerVP || verifyLerPresentation) as (params: {
                            presentation: VP;
                        }) => Promise<LerVerificationResultLike>
                    )({
                        presentation: resolvedPresentation,
                    });
                    boostLikeVerifications = filterOutBoostVerificationItems(
                        mapLerVerificationResultToItems(lerVerification)
                    );
                } else {
                    const rawCredentialVerifications = await sharedWallet?.invoke?.verifyCredential(
                        firstCredential,
                        {},
                        true
                    );
                    boostLikeVerifications = filterOutBoostVerificationItems(
                        Array.isArray(rawCredentialVerifications) ? rawCredentialVerifications : []
                    );
                }

                const hasProofCheck = boostLikeVerifications.some(item =>
                    (item.check || '').toLowerCase().includes('proof')
                );
                const hasExpiresCheck = boostLikeVerifications.some(item => {
                    const check = (item.check || '').toLowerCase();
                    return check.includes('expire') || check.includes('valid until');
                });
                const metadataChecks = buildResumeMetadataVerificationItems(firstCredential);

                const verifications: VerificationItem[] = [
                    ...boostLikeVerifications,
                    ...(hasProofCheck ? [] : [metadataChecks[0]]),
                    ...(hasExpiresCheck ? [] : [metadataChecks[1]]),
                ];

                const embeddedCredentialsByUri =
                    getEmbeddedVerificationCredentialsByIdFromLerVc(firstCredential);
                const nextResolvedCredentialsByUri: Record<string, VC | null> = {
                    ...embeddedCredentialsByUri,
                };
                const snapshot = await buildResumeBuilderSnapshotFromLerVc(
                    firstCredential,
                    'resume.pdf',
                    async uri => {
                        if (uri in nextResolvedCredentialsByUri) {
                            return nextResolvedCredentialsByUri[uri];
                        }

                        try {
                            const credential = (await sharedWallet.read.get(uri)) as VC | undefined;
                            nextResolvedCredentialsByUri[uri] = credential ?? null;
                            return credential ?? null;
                        } catch {
                            nextResolvedCredentialsByUri[uri] = null;
                            return null;
                        }
                    }
                );

                if (isCancelled) return;

                resumeBuilderStore.set.hydrateStore(snapshot, null);
                setResolvedCredentialsByUri(nextResolvedCredentialsByUri);
                setResumeCredential(firstCredential);
                setVerificationItems(verifications);
            } catch (err) {
                if (isCancelled) return;
                setError(
                    err instanceof Error ? err.message : 'Unable to resolve this shared resume.'
                );
            } finally {
                if (!isCancelled) setLoading(false);
            }
        };

        fetchSharedResume();
        return () => {
            isCancelled = true;
            resumeBuilderStore.set.hydrateStore(previousSnapshot, previousActiveResume);
        };
    }, [pin, rawUri, seed]);

    return (
        <IonPage>
            <IonHeader color="light">
                <IonToolbar className="flex">
                    <div className="flex justify-between items-center pl-[16px] pr-[16px] py-3 w-full">
                        <HeaderBranding
                            branding={BrandingEnum.learncard}
                            className="main-header-branding-public-route"
                        />
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleDownloadResume}
                                disabled={downloadingResume || loading || Boolean(error)}
                                className={`inline-flex items-center gap-2 h-9 rounded-full border border-grayscale-200 border-solid bg-white hover:bg-grayscale-50 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-500 font-semibold text-sm transition-colors ${
                                    isMobile ? 'w-9 justify-center px-0' : 'px-4'
                                }`}
                            >
                                {!(isMobile && downloadingResume) && (
                                    <DownloadIcon className="w-5 h-5" />
                                )}
                                {downloadingResume ? (
                                    <IonSpinner name="crescent" className="w-4 h-4" />
                                ) : (
                                    <span className={isMobile ? 'sr-only' : ''}>Download</span>
                                )}
                            </button>
                            <a
                                href="https://learncard.app/login"
                                className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white no-underline"
                            >
                                Get LearnCard
                            </a>
                        </div>
                    </div>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="bg-grayscale-100">
                <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.16),_transparent_35%),linear-gradient(180deg,#F8FAFC_0%,#EEF2FF_100%)]">
                    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
                        {loading ? (
                            <div className="flex min-h-[70vh] items-center justify-center">
                                <IonSpinner name="crescent" className="h-10 w-10 text-indigo-500" />
                            </div>
                        ) : error ? (
                            <div className="mx-auto mt-10 max-w-[680px] rounded-[28px] border border-grayscale-200 bg-white p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                                <h1 className="text-2xl font-bold text-grayscale-900">
                                    Resume unavailable
                                </h1>
                                <p className="mt-3 text-base text-grayscale-600">{error}</p>
                            </div>
                        ) : (
                            <>
                                {resumeCredential && (
                                    <SharedBoostVerificationBlock
                                        verificationItems={verificationItems}
                                        boost={resumeCredential}
                                        handleCloseModal={() => undefined}
                                    />
                                )}
                                {resumeCredential && (
                                    <SharedBoostVerificationBlock
                                        mode={SharedBoostVerificationBlockViewMode.mini}
                                        verificationItems={verificationItems}
                                        boost={resumeCredential}
                                        handleOnClick={presentVerificationModal}
                                        handleCloseModal={() => undefined}
                                    />
                                )}
                                <ResumePreview
                                    ref={resumePreviewRef}
                                    isMobile={isMobile}
                                    readOnly
                                    resolvedCredentialsByUri={resolvedCredentialsByUri}
                                    profileDid={getResumeSubjectDid(resumeCredential)}
                                />
                            </>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default VerifySharedResume;
