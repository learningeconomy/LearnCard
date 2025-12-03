import React, { useState, useMemo } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonPage, IonContent, IonSpinner, IonFooter, IonHeader } from '@ionic/react';
import { useModal, ModalTypes, useConfirmation } from 'learn-card-base';
import { ThreeDotVertical } from '@learncard/react';
import TrashBin from '../../components/svgs/TrashBin';

import useAppStore from './useAppStore';
import { EmbedIframeModal } from './EmbedIframeModal';
import useTheme from '../../theme/hooks/useTheme';
import AppScreenshotsSlider from '../../components/ai-passport-apps/helpers/AppScreenshotSlider';
import Checkmark from '../../components/svgs/Checkmark';

// Extended type to include new fields (until types package is rebuilt)
type ExtendedAppStoreListing = (AppStoreListing | InstalledApp) & {
    highlights?: string[];
    screenshots?: string[];
    promo_video_url?: string;
};

// Helper to convert YouTube/Vimeo URLs to embed URLs
const getEmbedUrl = (url: string): string | null => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    return null;
};

interface AppStoreDetailModalProps {
    listing: ExtendedAppStoreListing;
    isInstalled?: boolean;
    onInstallSuccess?: () => void;
}

const AppStoreDetailModal: React.FC<AppStoreDetailModalProps> = ({
    listing,
    isInstalled: initialIsInstalled = false,
    onInstallSuccess,
}) => {
    const { closeModal, replaceModal, newModal } = useModal();
    const confirm = useConfirmation();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    console.log(primaryColor);

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
            closeModal();
        } catch (error) {
            console.error('Failed to uninstall app:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUninstallConfirm = async () => {
        await confirm({
            text: `Are you sure you want to uninstall ${listing.display_name}?`,
            onConfirm: handleUninstall,
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-red-600 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

    const handleOpenOptionsMenu = () => {
        newModal(
            <ul className="w-full flex flex-col items-center justify-center ion-padding">
                <li className="w-full">
                    <button
                        className="text-[17px] font-poppins w-full flex items-center justify-between py-3 px-2"
                        type="button"
                        onClick={() => {
                            closeModal();
                            handleUninstallConfirm();
                        }}
                    >
                        <p className="text-red-600">Uninstall</p>
                        <TrashBin className="text-red-600" />
                    </button>
                </li>
            </ul>,
            { sectionClassName: '!max-w-[400px]' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleLaunch = () => {
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig.url) {

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
            {/* Header */}
            <IonHeader mode="ios" className="ion-no-border">
                <div className="ion-padding shadow-header bg-white">
                <div className="flex items-center justify-normal ion-padding">
                    <div className="h-[65px] w-[65px] mr-3">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid border-grayscale-200"
                            alt={`${listing.display_name} logo`}
                            src={listing.icon_url}
                            onError={e => {
                                (e.target as HTMLImageElement).src =
                                    'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                            }}
                        />
                    </div>

                    <div className="flex flex-col items-start justify-center flex-1 min-w-0">
                        <p className="text-[22px] font-semibold text-grayscale-900 font-poppins leading-[1]">
                            {listing.display_name}
                        </p>

                        <p className="text-sm text-grayscale-600 font-poppins mt-1">
                            {listing.tagline}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                            {listing.category && (
                                <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                    {listing.category}
                                </span>
                            )}

                            {installCount !== undefined && (
                                <span className="text-xs text-grayscale-500">
                                    {installCount.toLocaleString()} installs
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                </div>
            </IonHeader>

            <IonContent fullscreen className="ion-padding" style={{ '--background': '#00BA88' } as React.CSSProperties}>
                <div className="w-full flex flex-col pb-[120px]">
                    {/* About Section */}
                    <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                        <h3 className="text-xl text-gray-900 font-notoSans">About</h3>

                        <p className="text-grayscale-700 text-sm font-notoSans mt-2 font-normal whitespace-pre-wrap">
                            {listing.full_description}
                        </p>
                    </div>

                    {/* Highlights Section */}
                    {listing.highlights && listing.highlights.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans">Why Use This App?</h3>

                            {listing.highlights.map((highlight: string, index: number) => (
                                <div key={index} className="flex items-center justify-start mt-2">
                                    <Checkmark className="text-grayscale-900 w-[24px] h-auto mr-2 shrink-0" />

                                    <p className="text-grayscale-700 text-sm font-notoSans font-normal">
                                        {highlight}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Promo Video Section */}
                    {listing.promo_video_url && getEmbedUrl(listing.promo_video_url) && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Watch</h3>

                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                    src={getEmbedUrl(listing.promo_video_url)!}
                                    title="Promo Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    {/* Screenshots Section */}
                    {listing.screenshots && listing.screenshots.length > 0 && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-4">Preview</h3>

                            <AppScreenshotsSlider appScreenshots={listing.screenshots} />
                        </div>
                    )}

                    {/* Links Section */}
                    {(listing.privacy_policy_url || listing.terms_url) && (
                        <div className="rounded-[20px] bg-white mt-4 w-full ion-padding shadow-sm">
                            <h3 className="text-xl text-gray-900 font-notoSans mb-3">Links</h3>

                            <div className="space-y-3">
                                {listing.privacy_policy_url && (
                                    <a
                                        href={listing.privacy_policy_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-cyan-700 font-notoSans text-sm"
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
                                        className="flex items-center gap-2 text-cyan-700 font-notoSans text-sm"
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
                    )}
                </div>
            </IonContent>

            {/* Footer */}
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding gap-2">
                        <button
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 shadow-button-bottom flex gap-[5px] justify-center flex-1"
                        >
                            Back
                        </button>

                        {isCheckingInstalled ? (
                            <button
                                disabled
                                className="py-[9px] px-[20px] rounded-[30px] bg-gray-100 text-gray-400 font-notoSans text-[17px] flex items-center justify-center flex-1"
                            >
                                <IonSpinner name="dots" className="w-5 h-5" />
                            </button>
                        ) : isInstalled ? (
                            <>
                                {canLaunch && (
                                    <button
                                        onClick={handleLaunch}
                                        className={`bg-${primaryColor} py-[9px] px-[20px] rounded-[30px] text-white font-notoSans text-[17px] shadow-button-bottom flex items-center justify-center flex-1`}
                                    >
                                        Open
                                    </button>
                                )}

                                <button
                                    onClick={handleOpenOptionsMenu}
                                    className="p-2 rounded-full bg-white shadow-button-bottom flex items-center justify-center"
                                    aria-label="More options"
                                >
                                    <ThreeDotVertical className="w-6 h-6 text-grayscale-600" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleInstall}
                                disabled={isProcessing}
                                className={`bg-${primaryColor} py-[9px] px-[20px] rounded-[30px] text-white font-notoSans text-[17px] shadow-button-bottom disabled:opacity-50 flex items-center justify-center flex-1`}
                            >
                                {isProcessing ? (
                                    <IonSpinner name="dots" className="w-5 h-5" />
                                ) : (
                                    'Install'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </IonFooter>
        </IonPage>
    );
};

export default AppStoreDetailModal;
