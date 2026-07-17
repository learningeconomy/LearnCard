import React from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import AppGridTile from './AppGridTile';
import useAppLaunch from '../launchPad/useAppLaunch';

type MoreAppTileProps = {
    listing: AppStoreListing | InstalledApp;
    /** True when this is one of the user's installed apps (tapping launches it);
     *  false for suggested apps (tapping opens the store detail page). */
    isInstalled: boolean;
    onInstallSuccess?: () => void;
};

/**
 * A "More Apps" grid tile. Installed apps launch on tap (mirrors the "Open"
 * button in the browse list); suggested/not-installed apps open the app detail
 * page so the user can install them first.
 */
const MoreAppTile: React.FC<MoreAppTileProps> = ({ listing, isInstalled, onInstallSuccess }) => {
    const { handleLaunch, handleOpenDetail, isHardBlocked } = useAppLaunch({
        listing,
        isInstalled,
        onInstallSuccess,
    });

    // Mirror AppStoreListItem: hide age-hard-blocked apps entirely instead of
    // rendering a tile that only surfaces the block modal on tap.
    if (isHardBlocked) return null;

    return (
        <AppGridTile
            title={listing.display_name}
            icon={listing.icon_url}
            onClick={isInstalled ? handleLaunch : handleOpenDetail}
        />
    );
};

export default MoreAppTile;
