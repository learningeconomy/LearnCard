import React, { useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { alertCircleOutline, checkmarkCircle, rocketOutline } from 'ionicons/icons';

import { redirectStore } from 'learn-card-base';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';
import { decodeManifestFromUrl } from '@learncard/partner-connect-core';
import type { CapturedAppManifest } from '@learncard/partner-connect-core';

import useTheme from '../../../theme/hooks/useTheme';
import { PUBLISH_RESUME_KEY } from './publishResume';
import { describeManifest } from './appCapabilities';

const STEPS = ['Create account', 'Review', 'Publish'] as const;

const readManifest = (search: string): CapturedAppManifest | null => {
    const param = new URLSearchParams(search).get('manifest');
    if (!param) return null;

    try {
        const manifest = decodeManifestFromUrl(param);
        return manifest.manifestVersion === 1 && manifest.appUrl ? manifest : null;
    } catch {
        return null;
    }
};

const readHost = (appUrl: string): string => {
    try {
        return new URL(appUrl).host;
    } catch {
        return appUrl;
    }
};

const PublishSignInGate: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const brandingConfig = useBrandingConfig();
    const { colors } = useTheme();

    const brandName = brandingConfig?.name || 'LearnCard';
    const backgroundColor =
        colors?.defaults?.loginBgColor ?? colors?.defaults?.loaders?.[0] ?? '#058760';

    const manifest = useMemo(() => readManifest(location.search), [location.search]);
    const capturedLines = useMemo(() => (manifest ? describeManifest(manifest) : []), [manifest]);

    const appName = manifest?.suggestedName?.trim() || (manifest ? readHost(manifest.appUrl) : '');

    const continueToSignIn = () => {
        // lcnRedirect is resumed by the login page for existing accounts and by
        // onboarding after a new account's profile is created.
        redirectStore.set.lcnRedirect(location.pathname + location.search);
        try {
            sessionStorage.setItem(PUBLISH_RESUME_KEY, '1');
        } catch {
            // Storage can be unavailable (private mode); the resume banner is optional.
        }
        history.push('/login');
    };

    return (
        <IonPage>
            <IonContent style={{ '--background': backgroundColor } as React.CSSProperties}>
                <div className="min-h-full w-full flex items-center justify-center p-4 py-10">
                    <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow-2xl font-poppins p-8 animate-fade-in-up">
                        {manifest ? (
                            <>
                                <div className="flex flex-col items-center text-center mb-6">
                                    <div className="w-16 h-16 rounded-[20px] bg-grayscale-900 text-white flex items-center justify-center text-2xl font-semibold mb-4">
                                        {appName.charAt(0).toUpperCase()}
                                    </div>
                                    <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                        Publish {appName} to {brandName}
                                    </h1>
                                    <p className="text-xs text-grayscale-500 mb-3">
                                        {readHost(manifest.appUrl)}
                                    </p>
                                    <p className="text-sm text-grayscale-600 leading-relaxed">
                                        Create a free account to finish. It takes about a minute,
                                        and your app details are saved.
                                    </p>
                                </div>

                                <ol className="flex items-center justify-center gap-2 mb-6">
                                    {STEPS.map((step, index) => (
                                        <li key={step} className="flex items-center gap-2">
                                            <span
                                                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium ${
                                                    index === 0
                                                        ? 'bg-grayscale-900 text-white'
                                                        : 'bg-grayscale-100 text-grayscale-500'
                                                }`}
                                            >
                                                <span>{index + 1}</span>
                                                {step}
                                            </span>
                                            {index < STEPS.length - 1 && (
                                                <span className="w-3 h-px bg-grayscale-300" />
                                            )}
                                        </li>
                                    ))}
                                </ol>

                                {capturedLines.length > 0 && (
                                    <div className="mb-6 p-4 bg-grayscale-10 border border-grayscale-200 rounded-2xl">
                                        <p className="text-xs font-medium text-grayscale-700 mb-2.5">
                                            We saved what your app does
                                        </p>
                                        <ul className="space-y-2">
                                            {capturedLines.map(line => (
                                                <li
                                                    key={line}
                                                    className="flex items-start gap-2 text-sm text-grayscale-700"
                                                >
                                                    <IonIcon
                                                        icon={checkmarkCircle}
                                                        className="text-emerald-500 text-base mt-0.5 shrink-0"
                                                    />
                                                    {line}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={continueToSignIn}
                                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <IonIcon icon={rocketOutline} className="text-lg" />
                                    Create Free Account
                                </button>

                                <p className="text-sm text-grayscale-600 text-center mt-4">
                                    Already have an account?{' '}
                                    <button
                                        type="button"
                                        onClick={continueToSignIn}
                                        className="font-medium text-grayscale-900 hover:underline"
                                    >
                                        Sign in
                                    </button>
                                </p>

                                <p className="text-xs text-grayscale-400 text-center mt-4">
                                    You'll come right back here to finish publishing.
                                </p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                    <IonIcon
                                        icon={alertCircleOutline}
                                        className="text-red-400 text-2xl"
                                    />
                                </div>
                                <h1 className="text-xl font-semibold text-grayscale-900 mb-1">
                                    This publish link doesn't work
                                </h1>
                                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                                    Copy a fresh publish link from your app and try again.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => history.push('/login')}
                                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                >
                                    Go to {brandName}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default PublishSignInGate;
