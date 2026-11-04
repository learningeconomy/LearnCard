import React, { useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import {
    alertCircleOutline,
    documentTextOutline,
    shareSocialOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';

import {
    useFeatureConfig,
    useLinksConfig,
    useGetPreferencesForDid,
    useSchoolConnection,
    useClassLinkAuthorizeUrl,
} from 'learn-card-base';

import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import { startClassLinkLogin } from '../../auth/classlink/startClassLinkLogin';
import { TranscriptOptInCard } from '../../components/classlink/TranscriptOptInCard';
import MainHeader from '../../components/main-header/MainHeader';
import SchoolConnectTileIcon from '../myApps/icons/SchoolConnectTileIcon';
import classlinkLogo from 'learn-card-base/assets/images/classlink-logo.png';
import { useLocale } from '../../i18n';
import * as m from '../../paraglide/messages.js';

const ErrorBanner: React.FC<{ message: string }> = ({ message }) => (
    <div
        role="alert"
        className="mb-5 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5"
    >
        <IonIcon icon={alertCircleOutline} className="text-red-400 text-lg mt-0.5 shrink-0" />
        <span className="text-sm text-red-700 leading-relaxed">{message}</span>
    </div>
);

const SchoolConnectPage: React.FC = () => {
    const history = useHistory();
    const features = useFeatureConfig();
    const links = useLinksConfig();
    const { state: coordinatorState } = useAppAuth();
    const isReady = coordinatorState.status === 'ready';

    const { data: preferences } = useGetPreferencesForDid();
    const isLocked = preferences?.isMinor === true;

    const { data: connection, isLoading, isError, refetch } = useSchoolConnection(isReady);

    const { mutateAsync: getClassLinkAuthorizeUrl } = useClassLinkAuthorizeUrl();

    const [connecting, setConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const locale = useLocale();

    if (!features.schoolConnect || !features.classlinkSso) return <Redirect to="/launchpad" />;

    const formatDate = (iso: string): string => {
        const date = new Date(iso);
        return Number.isNaN(date.getTime())
            ? ''
            : new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
    };

    const handleConnect = async () => {
        if (connecting) return;
        setConnecting(true);
        setConnectError('');
        const ok = await startClassLinkLogin(
            getClassLinkAuthorizeUrl,
            path => history.push(path),
            '/school-connect',
            'connect'
        );
        if (!ok) {
            setConnectError(m['schoolConnect.connectFailed']());
            setConnecting(false);
        }
    };

    const handleInitialConnectClick = () => {
        if (isLocked) {
            void handleConnect();
        } else {
            setShowWarning(true);
        }
    };

    const renderContent = () => {
        if (isLoading || !isReady) {
            return (
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
                    <IonSpinner name="crescent" className="h-8 w-8" />
                </div>
            );
        }

        if (isError) {
            return (
                <div className="mx-auto w-full max-w-[560px] p-6">
                    <ErrorBanner message={m['schoolConnect.connectFailed']()} />
                    <button
                        type="button"
                        onClick={() => refetch()}
                        className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    >
                        {m['schoolConnect.tryAgain']()}
                    </button>
                </div>
            );
        }

        if (!connection?.available || !connection?.canConnect) {
            return (
                <div className="mx-auto w-full max-w-[560px] p-6 text-center">
                    <p className="text-sm text-grayscale-600">
                        {m['schoolConnect.notAvailable']()}
                    </p>
                </div>
            );
        }

        if (connection.connected) {
            return (
                <div className="mx-auto w-full max-w-[560px] space-y-6 p-6">
                    <div className="rounded-[20px] bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-grayscale-900">
                                    {connection.schoolName || m['schoolConnect.yourSchool']()}
                                </h2>
                                {connection.lastConnectedAt && (
                                    <p className="mt-1 text-xs text-grayscale-500">
                                        {m['schoolConnect.lastConnected']({
                                            date: formatDate(connection.lastConnectedAt),
                                        })}
                                    </p>
                                )}
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                                {m['schoolConnect.connected']()}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleConnect}
                            disabled={connecting}
                            className="w-full rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                        >
                            {connecting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <IonSpinner name="crescent" className="h-4 w-4" />
                                    {m['schoolConnect.connecting']()}
                                </span>
                            ) : (
                                m['schoolConnect.refreshConnection']()
                            )}
                        </button>
                        {connectError && (
                            <div className="mt-4">
                                <ErrorBanner message={connectError} />
                            </div>
                        )}
                    </div>

                    <TranscriptOptInCard />

                    {connection.isStudent && (
                        <p className="text-center text-xs text-grayscale-500">
                            {m['schoolConnect.studentNote']()}
                        </p>
                    )}
                </div>
            );
        }

        if (showWarning) {
            return (
                <div className="mx-auto w-full max-w-[560px] p-6">
                    <div className="rounded-[20px] bg-white p-8 text-center shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold text-grayscale-900">
                            {m['schoolConnect.warningTitle']()}
                        </h2>
                        <p className="mb-8 text-sm leading-relaxed text-grayscale-600">
                            {m['schoolConnect.warningBody']()}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={handleConnect}
                                disabled={connecting}
                                className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                {connecting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <IonSpinner name="crescent" className="h-4 w-4" />
                                        {m['schoolConnect.connecting']()}
                                    </span>
                                ) : (
                                    m['schoolConnect.connectWithClassLink']()
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowWarning(false)}
                                disabled={connecting}
                                className="w-full rounded-[20px] border border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
                            >
                                {m['schoolConnect.notNow']()}
                            </button>
                        </div>
                        {connectError && (
                            <div className="mt-4">
                                <ErrorBanner message={connectError} />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="mx-auto w-full max-w-[560px] p-6">
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-6 h-24 w-24">
                        <SchoolConnectTileIcon />
                    </div>
                    <h1 className="mb-2 text-2xl font-semibold text-grayscale-900">
                        {m['schoolConnect.heroTitle']()}
                    </h1>
                    <p className="text-sm text-grayscale-600">{m['schoolConnect.heroSubhead']()}</p>
                </div>

                <div className="mb-10 space-y-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <IonIcon icon={documentTextOutline} className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-grayscale-900">
                                {m['schoolConnect.benefit1']()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <IonIcon icon={shareSocialOutline} className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-grayscale-900">
                                {m['schoolConnect.benefit2']()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <IonIcon icon={shieldCheckmarkOutline} className="text-xl" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-grayscale-900">
                                {m['schoolConnect.benefit3']()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[20px] bg-white p-6 shadow-sm">
                    <h2 className="mb-4 text-sm font-medium text-grayscale-900">
                        {m['schoolConnect.chooseProvider']()}
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-4 rounded-xl border border-grayscale-200 p-4">
                            <img
                                src={classlinkLogo}
                                alt="ClassLink"
                                className="h-8 object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleInitialConnectClick}
                                disabled={connecting}
                                className="w-full rounded-[20px] bg-grayscale-900 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                {connecting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <IonSpinner name="crescent" className="h-4 w-4" />
                                        {m['schoolConnect.connecting']()}
                                    </span>
                                ) : (
                                    m['schoolConnect.connectWithClassLink']()
                                )}
                            </button>
                        </div>
                    </div>
                    {connectError && (
                        <div className="mt-4">
                            <ErrorBanner message={connectError} />
                        </div>
                    )}
                </div>

                <div className="mt-10 text-center">
                    <p className="mb-1 text-sm font-medium text-grayscale-900">
                        {m['schoolConnect.dontSeeSchool']()}
                    </p>
                    <p className="mb-3 text-xs text-grayscale-600">
                        {m['schoolConnect.moreComingSoon']()}
                    </p>
                    {links.supportEmail && (
                        <a
                            href={`mailto:${links.supportEmail}?subject=${encodeURIComponent(m['schoolConnect.mailtoSubject']())}&body=${encodeURIComponent(m['schoolConnect.mailtoBody']())}`}
                            className="text-sm font-medium text-grayscale-600 transition-colors hover:text-grayscale-900"
                        >
                            {m['schoolConnect.askToAdd']()}
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        <IonPage className="bg-grayscale-100 font-poppins">
            <MainHeader showBackButton customClassName="bg-grayscale-100" />
            <IonContent fullscreen className="bg-grayscale-100" color="grayscale-100">
                <div className="animate-fade-in-up pb-10">{renderContent()}</div>
            </IonContent>
        </IonPage>
    );
};

export default SchoolConnectPage;
