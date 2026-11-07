import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import {
    alertCircleOutline,
    documentTextOutline,
    shareSocialOutline,
    shieldCheckmarkOutline,
} from 'ionicons/icons';
import type { SchoolConnection } from '@learncard/lca-api-plugin';

import SchoolConnectTileIcon from '../myApps/icons/SchoolConnectTileIcon';
import classlinkLogo from 'learn-card-base/assets/images/classlink-logo.png';
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

export type SchoolConnectViewProps = {
    connection?: SchoolConnection;
    isLoading: boolean;
    isError: boolean;
    /** The account already has student settings, so connecting changes nothing for it. */
    isLocked: boolean;
    supportEmail?: string;
    connecting: boolean;
    connectError: string;
    onConnect: () => void;
    onRetry: () => void;
    formatDate: (iso: string) => string;
    transcriptSlot?: React.ReactNode;
};

/** Every School Connect state, without data loading, so it can be rendered in isolation. */
export const SchoolConnectView: React.FC<SchoolConnectViewProps> = ({
    connection,
    isLoading,
    isError,
    isLocked,
    supportEmail,
    connecting,
    connectError,
    onConnect,
    onRetry,
    formatDate,
    transcriptSlot,
}) => {
    const [showWarning, setShowWarning] = useState(false);

    const handleInitialConnectClick = () => {
        if (isLocked) onConnect();
        else setShowWarning(true);
    };

    if (isLoading) {
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
                    onClick={onRetry}
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
                <p className="text-sm text-grayscale-600">{m['schoolConnect.notAvailable']()}</p>
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
                        onClick={onConnect}
                        disabled={connecting}
                        className="w-full rounded-[20px] border border-solid border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
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

                {transcriptSlot}

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
                            onClick={onConnect}
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
                            className="w-full rounded-[20px] border border-solid border-grayscale-300 px-4 py-3 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10 disabled:opacity-40"
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
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[19%] bg-gradient-to-b from-emerald-200 to-emerald-600 p-4 shadow-sm">
                    <div className="aspect-square w-full">
                        <SchoolConnectTileIcon />
                    </div>
                </div>
                <h1 className="mb-2 text-2xl font-semibold text-grayscale-900">
                    {m['schoolConnect.heroTitle']()}
                </h1>
                <p className="text-sm text-grayscale-600">{m['schoolConnect.heroSubhead']()}</p>
            </div>

            <div className="mb-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <IonIcon icon={documentTextOutline} className="text-xl" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-grayscale-900">
                            {m['schoolConnect.benefit1']()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <IonIcon icon={shareSocialOutline} className="text-xl" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-grayscale-900">
                            {m['schoolConnect.benefit2']()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
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
                    <div className="flex flex-col items-center gap-4 rounded-xl border border-solid border-grayscale-200 p-4">
                        <img src={classlinkLogo} alt="ClassLink" className="h-14 object-contain" />
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
                {supportEmail && (
                    <a
                        href={`mailto:${supportEmail}?subject=${encodeURIComponent(m['schoolConnect.mailtoSubject']())}&body=${encodeURIComponent(m['schoolConnect.mailtoBody']())}`}
                        className="text-sm font-medium text-grayscale-600 transition-colors hover:text-grayscale-900"
                    >
                        {m['schoolConnect.askToAdd']()}
                    </a>
                )}
            </div>
        </div>
    );
};

export default SchoolConnectView;
