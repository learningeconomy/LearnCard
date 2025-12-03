import React, { useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import { useModal } from 'learn-card-base';

import useAppStore from './useAppStore';
import { EmbedIframeModal } from './EmbedIframeModal';

interface AppStoreDetailModalProps {
    listing: AppStoreListing | InstalledApp;
    isInstalled?: boolean;
    onInstallSuccess?: () => void;
}

const AppStoreDetailModal: React.FC<AppStoreDetailModalProps> = ({
    listing,
    isInstalled: initialIsInstalled = false,
    onInstallSuccess,
}) => {
    const { closeModal, replaceModal } = useModal();
    const history = useHistory();

    const { useInstallApp, useUninstallApp, useInstallCount, useIsAppInstalled } = useAppStore();

    const installMutation = useInstallApp();
    const uninstallMutation = useUninstallApp();

    // Check installation status
    const { data: isInstalledData, isLoading: isCheckingInstalled } = useIsAppInstalled(
        listing.listing_id
    );

    const isInstalled = isInstalledData ?? initialIsInstalled ?? ('installed_at' in listing);

    // Get install count
    const { data: installCount } = useInstallCount(listing.listing_id);

    const [isProcessing, setIsProcessing] = useState(false);

    // Parse launch config
    const launchConfig = useMemo(() => {
        try {
            return JSON.parse(listing.launch_config_json);
        } catch {
            return {};
        }
    }, [listing.launch_config_json]);

    const handleInstall = async () => {
        setIsProcessing(true);

        try {
            await installMutation.mutateAsync(listing.listing_id);
            onInstallSuccess?.();
        } catch (error) {
            console.error('Failed to install app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUninstall = async () => {
        setIsProcessing(true);

        try {
            await uninstallMutation.mutateAsync(listing.listing_id);
        } catch (error) {
            console.error('Failed to uninstall app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLaunch = () => {
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {
            console.log('launching iframe', launchConfig.url);

            replaceModal(
                <EmbedIframeModal
                    embedUrl={launchConfig.url}
                    appId={listing.listing_id}
                    appName={listing.display_name}
                />
            );
        } else if (listing.launch_type === 'DIRECT_LINK' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        } else if (listing.launch_type === 'SECOND_SCREEN' && launchConfig.url) {
            window.open(launchConfig.url, '_blank');
        }
    };

    const canLaunch =
        listing.launch_type === 'EMBEDDED_IFRAME' ||
        listing.launch_type === 'DIRECT_LINK' ||
        listing.launch_type === 'SECOND_SCREEN';

    return (
        <IonPage className="h-full w-full">
            <IonContent fullscreen className="ion-padding">
                <div className="w-full h-full flex flex-col bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <button
                            onClick={closeModal}
                            className="text-indigo-600 font-medium hover:text-indigo-700"
                        >
                            ← Back
                        </button>
                    </div>

                    {/* App Info */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            {/* App Header */}
                            <div className="flex items-start gap-4 mb-6">
                                <img
                                    src={listing.icon_url}
                                    alt={listing.display_name}
                                    className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                                    onError={e => {
                                        (e.target as HTMLImageElement).src =
                                            'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                    }}
                                />

                                <div className="flex-1 min-w-0">
                                    <h1 className="text-2xl font-bold text-grayscale-900 mb-1">
                                        {listing.display_name}
                                    </h1>

                                    <p className="text-grayscale-600 mb-2">{listing.tagline}</p>

                                    {listing.category && (
                                        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
                                            {listing.category}
                                        </span>
                                    )}

                                    {installCount !== undefined && (
                                        <p className="text-sm text-grayscale-500 mt-2">
                                            {installCount.toLocaleString()} installs
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mb-8">
                                {isCheckingInstalled ? (
                                    <button
                                        disabled
                                        className="flex-1 py-3 px-6 rounded-full bg-gray-100 text-gray-400 font-semibold flex items-center justify-center"
                                    >
                                        <IonSpinner name="dots" className="w-5 h-5" />
                                    </button>
                                ) : isInstalled ? (
                                    <>
                                        {canLaunch && (
                                            <button
                                                onClick={handleLaunch}
                                                className="flex-1 py-3 px-6 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
                                            >
                                                Open
                                            </button>
                                        )}

                                        <button
                                            onClick={handleUninstall}
                                            disabled={isProcessing}
                                            className="py-3 px-6 rounded-full border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            {isProcessing ? (
                                                <IonSpinner name="dots" className="w-5 h-5" />
                                            ) : (
                                                'Uninstall'
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleInstall}
                                        disabled={isProcessing}
                                        className="flex-1 py-3 px-6 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {isProcessing ? (
                                            <IonSpinner name="dots" className="w-5 h-5" />
                                        ) : (
                                            'Install'
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-grayscale-900 mb-3">
                                    About this app
                                </h2>

                                <p className="text-grayscale-700 whitespace-pre-wrap leading-relaxed">
                                    {listing.full_description}
                                </p>
                            </div>

                            {/* Links */}
                            <div className="space-y-3">
                                {listing.privacy_policy_url && (
                                    <a
                                        href={listing.privacy_policy_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Privacy Policy
                                    </a>
                                )}

                                {listing.terms_url && (
                                    <a
                                        href={listing.terms_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                            />
                                        </svg>
                                        Terms of Service
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AppStoreDetailModal;
