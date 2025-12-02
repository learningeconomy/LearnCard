import React from 'react';

import ScoutsLogo from '../components/svgs/ScoutsLogo';
import ScoutIdThumbPlaceholder from '../components/svgs/ScoutIdThumbPlaceholder';
import LeaderIdThumbPlaceholder from '../components/svgs/LeaderIdThumbPlaceholder';
import NationalAdminIdThumbPlaceholder from '../components/svgs/NationalAdminIdThumbPlaceholder';
import GlobalAdminIdThumbPlaceholder from '../components/svgs/GlobalAdminIdThumbPlaceholder';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { VC, Boost } from '@learncard/types';
import { ScoutsRoleEnum } from '../stores/troopPageStore';
import { TroopCMSAppearance, TroopsCMSViewModeEnum } from '../components/troopsCMS/troopCMSState';
import {
    useGetBoostParents,
    useCountBoostChildren,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';
import { insertParamsToFilestackUrl } from 'learn-card-base';

type AllowedBackgroundStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
    color?: string;
};

type AllowedWallpaperStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
};

export const getIdBackgroundStyles = (idStyles?: TroopCMSAppearance, credential?: VC) => {
    const {
        idBackgroundImage: idImage,
        dimIdBackgroundImage: idDimBg,
        idBackgroundColor: idBgColor,
        repeatIdBackgroundImage: idRepeat,
        fontColor: idFontColor,
    } = idStyles ?? {};
    const {
        backgroundImage: credImage,
        dimBackgroundImage: credDimBg,
        idBackgroundColor: credIdBgColor,
        repeatIdBackgroundImage: credRepeat,
        fontColor: credFontColor,
    } = credential?.boostID ?? {};

    const backgroundUrl = insertParamsToFilestackUrl(
        idImage ?? credImage,
        'resize=width:600/quality=value:75/'
    );

    const dimBackgroundImage = idDimBg ?? credDimBg;
    const backgroundColor = idBgColor ?? credIdBgColor;
    const repeatBackgroundImage = idRepeat ?? credRepeat;

    let backgroundStyles: AllowedBackgroundStylesType = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // This makes it fixed
        backgroundSize: 'cover',
        backgroundImage: `url(${backgroundUrl})`,
        backgroundRepeat: 'no-repeat',
    };

    if (dimBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${backgroundUrl})`,
        };

        if (backgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${backgroundColor}80, ${backgroundColor}80), url(${backgroundUrl})`,
            };
        }
    }

    if (repeatBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!dimBackgroundImage && !backgroundUrl) {
        backgroundStyles.backgroundColor = backgroundColor;
    }

    backgroundStyles.color = idFontColor ?? credFontColor;

    return backgroundStyles;
};

export const getWallpaperBackgroundStyles = (
    wallpaperStyles?: TroopCMSAppearance,
    credential?: VC
) => {
    const {
        backgroundImage: wpBgImage,
        backgroundColor: wpBgColor,
        fadeBackgroundImage: wpFade,
        repeatBackgroundImage: wpRepeat,
    } = wallpaperStyles ?? {};
    const {
        backgroundImage: credBgImage,
        backgroundColor: credBgColor,
        fadeBackgroundImage: credFade,
        repeatBackgroundImage: credRepeat,
    } = credential?.display ?? {};

    const wallpaperImage = insertParamsToFilestackUrl(
        wpBgImage ?? credBgImage,
        'resize=width:1000/quality=value:75/'
    );
    const wallpaperBackgroundColor = wpBgColor ?? credBgColor;
    const isWallpaperFaded = wpFade ?? credFade ?? false;
    const isWallpaperTiled = wpRepeat ?? credRepeat ?? false;

    let backgroundStyles: AllowedWallpaperStylesType = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // This makes it fixed
        backgroundSize: 'cover',
        backgroundImage: `url(${wallpaperImage})`,
        backgroundRepeat: 'no-repeat',
    };

    if (isWallpaperFaded) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${wallpaperImage})`,
        };

        if (wallpaperBackgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${wallpaperBackgroundColor}80, ${wallpaperBackgroundColor}80), url(${wallpaperImage})`,
            };
        }
    }

    if (isWallpaperTiled) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: '200px',
        };
    }

    if (!isWallpaperFaded) {
        backgroundStyles.backgroundColor = wallpaperStyles?.backgroundColor;
    }

    return backgroundStyles;
};

export const getRoleFromCred = (credential: VC): ScoutsRoleEnum => {
    return getScoutsRole(credential); // got duplicated, we'll just make this one use getScoutsRole
};

export const getScoutDefaultsForRole = (role: ScoutsRoleEnum) => {
    switch (role) {
        case ScoutsRoleEnum.leader:
            return {
                roleName: 'Leader',
                IdPlaceholder: LeaderIdThumbPlaceholder,
            };
        case ScoutsRoleEnum.national:
            return {
                roleName: 'Admin',
                IdPlaceholder: NationalAdminIdThumbPlaceholder,
            };
        case ScoutsRoleEnum.global:
            return {
                roleName: 'Admin',
                IdPlaceholder: GlobalAdminIdThumbPlaceholder,
            };
        case ScoutsRoleEnum.scout:
        default:
            return {
                roleName: 'Scout',
                IdPlaceholder: ScoutIdThumbPlaceholder,
            };
    }
};

export const getTroopIdThumbOrDefault = (credential: VC, className: string = '') => {
    const boostIdThumb = credential?.boostID?.idThumbnail;
    if (boostIdThumb) return <img src={boostIdThumb} className={className} />;

    const role = getRoleFromCred(credential);
    const { IdPlaceholder } = getScoutDefaultsForRole(role);
    return <IdPlaceholder className={className} />;
};

export const getScoutsRole = (credential: VC | Boost) => {
    if (!credential) return ScoutsRoleEnum.scout;

    const type =
        credential.credentialSubject?.achievement?.achievementType ||
        credential.boostCredential?.credentialSubject?.achievement?.achievementType;

    switch (type) {
        case AchievementTypes.Global:
            return ScoutsRoleEnum.global;
        case AchievementTypes.Network:
        case 'ext:Network':
            return ScoutsRoleEnum.national;
        case AchievementTypes.Troop:
            return ScoutsRoleEnum.leader;
        case AchievementTypes.ScoutMember:
            return ScoutsRoleEnum.scout;
        default:
            console.error(`Failed to map credential type (${type}) to role. Defaulting to scout`);
            return ScoutsRoleEnum.scout;
    }
};

export const getScoutsNounForCred = (credential: VC) => {
    const role = getRoleFromCred(credential);
    return getScoutsNounForRole(role);
};

export const getScoutsNounForRole = (role: ScoutsRoleEnum, shorten?: boolean) => {
    switch (role) {
        case ScoutsRoleEnum.scout:
            return 'Scout';
        case ScoutsRoleEnum.leader:
            if (shorten) return 'Troop';
            return 'Troop Leader';
        case ScoutsRoleEnum.national:
            if (shorten) return 'National Network';
            return 'National Network Admin';
        case ScoutsRoleEnum.global:
            if (shorten) return 'Global Network';
            return 'Global Network Admin';
    }
};

export const useGetNetworkFromTroop = (troopUri?: string) => {
    const { data: parentBoosts, isLoading } = useGetBoostParents(troopUri);

    // Assumes a troop can only have one parent network
    return parentBoosts?.records?.[0];
};

export const useGetNetworkBadgeCount = (networkUri?: string) => {
    const { data: nationalBadgeCount, isLoading: nationalBadgeCountLoading } =
        useCountBoostChildren(networkUri, 2, {
            category: BoostCategoryOptionsEnum.meritBadge,
        });

    return { nationalBadgeCount, nationalBadgeCountLoading };
};

export const isTroopCredential = (credential: VC) => {
    const troopTypes = [
        AchievementTypes.Troop,
        AchievementTypes.Global,
        AchievementTypes.Network,
        AchievementTypes.ScoutMember,
    ];
    const credType = credential?.credentialSubject?.achievement?.achievementType;
    return troopTypes.includes(credType);
};

export const isTroopCategory = (category: BoostCategoryOptionsEnum) => {
    return [
        BoostCategoryOptionsEnum.globalAdminId,
        BoostCategoryOptionsEnum.nationalNetworkAdminId,
        BoostCategoryOptionsEnum.troopLeaderId,
        BoostCategoryOptionsEnum.scoutId,
    ].includes(category);
};

export const getDefaultBadgeThumbForRole = (role: ScoutsRoleEnum, className = '') => {
    return role === ScoutsRoleEnum.global ? (
        <ScoutsLogo className={`text-sp-purple-base ${className}`} />
    ) : (
        <ScoutsLogo className={`text-sp-green-forest ${className}`} />
    );
};

export const getDefaultBadgeThumbForCredential = (credential: VC, className?: string) => {
    const role = getRoleFromCred(credential);
    return getDefaultBadgeThumbForRole(role, className);
};

export const getDefaultBadgeThumbForViewMode = (
    viewMode: TroopsCMSViewModeEnum,
    className?: string
) => {
    let role;
    switch (viewMode) {
        case TroopsCMSViewModeEnum.global:
            role = ScoutsRoleEnum.global;
            break;
        case TroopsCMSViewModeEnum.network:
            role = ScoutsRoleEnum.national;
            break;
        case TroopsCMSViewModeEnum.troop:
        case TroopsCMSViewModeEnum.leader:
            role = ScoutsRoleEnum.leader;
            break;
        case TroopsCMSViewModeEnum.member:
        default:
            role = ScoutsRoleEnum.scout;
            break;
    }
    return getDefaultBadgeThumbForRole(role, className);
};
