import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import moment from 'moment';

import { IonContent, IonHeader, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { VC, VP } from '@learncard/types';

import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { useDeviceTypeByWidth } from 'learn-card-base';

import ResumePreview from '../../components/resume-builder/resume-preview/ResumePreview';
import {
    buildResumeBuilderSnapshotFromLerVc,
    getEmbeddedVerificationCredentialsByIdFromLerVc,
    getResumeBuilderSnapshot,
} from '../../components/resume-builder/resume-builder-history.helpers';
import {
    asRecord,
    asString,
    firstStringFromPaths,
} from '../../components/resume-builder/resume-builder-parsing.helpers';
import { resumeBuilderStore } from '../../stores/resumeBuilderStore';

const getQueryParam = (value: string | string[] | null): string => {
    if (Array.isArray(value)) return value[0] ?? '';
    return value ?? '';
};

const getResumeHeader = (credential: VC | null): { title: string; subtitle: string } => {
    const credentialSubject = asRecord(credential?.credentialSubject);
    const narratives = Array.isArray(credentialSubject?.narratives)
        ? credentialSubject.narratives
        : [];

    const name =
        firstStringFromPaths(credentialSubject, [['person', 'name', 'formattedName']]) ||
        'Shared Resume';
    const career =
        firstStringFromPaths(
            narratives.find(
                narrative => asString(asRecord(narrative)?.name) === 'Professional Title'
            ),
            [['texts', '0', 'lines', '0']]
        ) || '';

    return {
        title: name,
        subtitle: career || 'Verifiable Resume',
    };
};

const VerifySharedResume: React.FC = () => {
    const { isMobile } = useDeviceTypeByWidth();
    const location = useLocation();
    const { uri: rawUriParam, seed: seedParam, pin: pinParam } = queryString.parse(location.search);
    const rawUri = getQueryParam(rawUriParam);
    const seed = getQueryParam(seedParam);
    const pin = getQueryParam(pinParam);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [resumeCredential, setResumeCredential] = useState<VC | null>(null);
    const [resolvedCredentialsByUri, setResolvedCredentialsByUri] = useState<
        Record<string, VC | null>
    >({});

    useEffect(() => {
        const previousSnapshot = getResumeBuilderSnapshot();
        const previousActiveResume = resumeBuilderStore.get.activeResume();
        let isCancelled = false;

        setLoading(true);
        setError('');
        setResumeCredential(null);
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
                        <a
                            href="https://learncard.app/login"
                            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white no-underline"
                        >
                            Get LearnCard
                        </a>
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
                            <ResumePreview
                                isMobile={isMobile}
                                readOnly
                                resolvedCredentialsByUri={resolvedCredentialsByUri}
                            />
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default VerifySharedResume;
