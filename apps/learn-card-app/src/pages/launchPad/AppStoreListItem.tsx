import React from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { IonItem, IonSpinner } from '@ionic/react';
import { ThreeDotVertical } from '@learncard/react';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';
import useAppLaunch from './useAppLaunch';

type AppStoreListItemProps = {
    listing: AppStoreListing | InstalledApp;
    isInstalled?: boolean;
    isInstalledLoading?: boolean;
    onInstallSuccess?: () => void;
};

const AppStoreListItem: React.FC<AppStoreListItemProps> = ({
    listing,
    isInstalled = false,
    isInstalledLoading = false,
    onInstallSuccess,
}) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.launchPad);

    const buttonClass = `flex items-center justify-center rounded-full font-[600] px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.unconnected}`;
    const connectedButtonClass = `flex items-center justify-center rounded-full font-[600] px-[20px] py-[5px] normal text-base font-poppins ${colors?.buttons?.connected}`;

    const {
        handleLaunch,
        handleOpenDetail,
        showAgeBlockedModal,
        isHardBlocked,
        launchConfig,
        installedAt,
    } = useAppLaunch({ listing, isInstalled, onInstallSuccess });

    // Hide app entirely if user is hard-blocked by min_age
    if (isHardBlocked) {
        return null;
    }

    return (
        <IonItem
            lines="none"
            className="w-full max-w-[600px] ion-no-border px-[12px] py-[12px] max-h-[76px] border-gray-200 border-b-2 last:border-b-0 flex bg-white items-center justify-between notificaion-list-item overflow-visible rounded-[12px] mt-2 first:mt-4 shadow-sm"
        >
            <div className="flex items-center justify-start w-full bg-white-100">
                <div className="rounded-lg w-[50px] h-[50px] mr-3 min-w-[50px] min-h-[50px]">
                    <img
                        className="w-full h-full object-cover bg-white rounded-lg"
                        src={listing.icon_url}
                        alt={`${listing.display_name} icon`}
                        onError={e => {
                            (e.target as HTMLImageElement).src =
                                'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                        }}
                    />
                </div>

                <div className="right-side flex justify-between w-full">
                    <div className="flex flex-col items-start justify-center text-left flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0 w-full">
                            <p className="text-grayscale-900 font-medium line-clamp-1 min-w-0">
                                {listing.display_name}
                            </p>
                            {listing.age_rating && (
                                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-grayscale-100 text-grayscale-700 text-[10px] font-medium rounded-full shrink-0">
                                    Age {listing.age_rating}
                                </span>
                            )}
                        </div>

                        <p className="text-grayscale-600 font-medium text-[12px] line-clamp-2 pr-1">
                            {listing.tagline}
                        </p>
                    </div>

                    <div className="flex app-connect-btn-container items-center ml-2 gap-2 shrink-0">
                        {isInstalledLoading ? (
                            <button className={buttonClass} disabled>
                                <IonSpinner name="dots" className="w-4 h-4" />
                            </button>
                        ) : isInstalled || installedAt || launchConfig.skipInstallation ? (
                            <>
                                <button onClick={handleLaunch} className={connectedButtonClass}>
                                    Open
                                </button>

                                <button
                                    onClick={handleOpenDetail}
                                    className="p-1 rounded-full hover:bg-grayscale-100 transition-colors"
                                    aria-label="More options"
                                >
                                    <ThreeDotVertical className="w-5 h-5 text-grayscale-600" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    // Hard block check (defensive - should be hidden but user might navigate directly)
                                    if (isHardBlocked) {
                                        showAgeBlockedModal();
                                        return;
                                    }
                                    handleOpenDetail();
                                }}
                                className={buttonClass}
                            >
                                Get
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </IonItem>
    );
};

export default AppStoreListItem;
