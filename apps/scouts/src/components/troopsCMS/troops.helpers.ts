import { TroopsCMSState, TroopsCMSViewModeEnum } from './troopCMSState';
import { CredentialCategoryEnum, insertParamsToFilestackUrl } from 'learn-card-base';
import { BoostPermissions } from '@learncard/types';
import { TroopsAppearanceTabs } from './TroopsCMSAppearanceForm/TroopsCMSAppearanceTabs';

export const PermissionsByRole: {
    [key in TroopsCMSViewModeEnum]?: BoostPermissions;
} = {
    [TroopsCMSViewModeEnum.global]: {
        role: 'Global Admin',
        canEdit: true,
        canIssue: true,
        canRevoke: true,
        canManagePermissions: true,
        canIssueChildren: '*',
        canCreateChildren: '*',
        canEditChildren: '*',
        canRevokeChildren: '*',
        canManageChildrenPermissions: '*',
        canViewAnalytics: true,
    },
    [TroopsCMSViewModeEnum.network]: {
        role: 'Director',
        canEdit: false,
        canIssue: false,
        canRevoke: false,
        canManagePermissions: true,
        canIssueChildren: '*',
        canCreateChildren: '*',
        canEditChildren: '*',
        canRevokeChildren: '*',
        canManageChildrenPermissions: '*',
        canViewAnalytics: true,
    },
    [TroopsCMSViewModeEnum.troop]: {
        role: 'Leader',
        canEdit: false,
        canIssue: false,
        canRevoke: false,
        canManagePermissions: false,
        canIssueChildren: '*',
        canCreateChildren: '',
        canEditChildren: '',
        canRevokeChildren: '*',
        canManageChildrenPermissions: '*',
        canViewAnalytics: true,
    },
    [TroopsCMSViewModeEnum.member]: {
        role: 'Scout',
        canEdit: false,
        canIssue: false,
        canRevoke: false,
        canManagePermissions: false,
        canIssueChildren: '',
        canCreateChildren: '',
        canEditChildren: '',
        canRevokeChildren: '',
        canManageChildrenPermissions: '',
        canViewAnalytics: false,
    },
};

export const getPermissionsByRole = (role: TroopsCMSViewModeEnum) => {
    return PermissionsByRole[role];
};

export const getBadgeThumbnail = (state: TroopsCMSState) => {
    let thumbnail = state?.appearance?.badgeThumbnail
        ? insertParamsToFilestackUrl(
              state?.appearance?.badgeThumbnail,
              'resize=width:200/quality=value:75/'
          )
        : '';

    if (state?.inheritNetworkStyles) thumbnail = state?.parentID?.appearance?.badgeThumbnail ?? '';

    return thumbnail;
};

export const DEFAULT_COLOR_DARK = '#353E64';
export const DEFAULT_COLOR_LIGHT = '#EFF0F5';

export const getTabColor = (tab: TroopsAppearanceTabs, existingColor?: string) => {
    if (tab === TroopsAppearanceTabs.dark) return DEFAULT_COLOR_DARK;
    if (tab === TroopsAppearanceTabs.light) return DEFAULT_COLOR_LIGHT;
    return existingColor;
};

export const convertColorToTab = (currentColor: string) => {
    if (currentColor === DEFAULT_COLOR_DARK) return TroopsAppearanceTabs.dark;
    if (currentColor === DEFAULT_COLOR_LIGHT) return TroopsAppearanceTabs.light;
    return TroopsAppearanceTabs.custom;
};

export const convertTabToColor = (tab: TroopsAppearanceTabs, currentColor?: string) => {
    if (tab === TroopsAppearanceTabs.dark) return DEFAULT_COLOR_DARK;
    if (tab === TroopsAppearanceTabs.light) return DEFAULT_COLOR_LIGHT;
    return currentColor;
};

export const isFontColorDark = (fontColor: string) => {
    if (fontColor === DEFAULT_COLOR_DARK) return true;
    if (fontColor === DEFAULT_COLOR_LIGHT) return false;
};

export const getPresetIDStylesSelected = (
    currentState: TroopsCMSState,
    viewMode: TroopsCMSViewModeEnum
): TroopsCMSState => {
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const activeAppearanceTab = isInMemberViewMode
        ? currentState?.memberID?.appearance?.activeAppearanceTab
        : currentState?.appearance?.activeAppearanceTab;

    if (activeAppearanceTab === TroopsAppearanceTabs.dark) {
        if (isInMemberViewMode) {
            return {
                ...currentState,

                memberID: {
                    ...currentState?.memberID,
                    appearance: {
                        ...currentState?.memberID?.appearance,
                        idBackgroundColor: DEFAULT_COLOR_DARK,
                        fontColor: DEFAULT_COLOR_LIGHT,
                        dimIdBackgroundImage: true,
                    },
                },
            };
        }

        return {
            ...currentState,
            appearance: {
                ...currentState?.appearance,
                idBackgroundColor: DEFAULT_COLOR_DARK,
                fontColor: DEFAULT_COLOR_LIGHT,
            },
        };
    } else if (activeAppearanceTab === TroopsAppearanceTabs.light) {
        if (isInMemberViewMode) {
            return {
                ...currentState,
                memberID: {
                    ...currentState?.memberID,
                    appearance: {
                        ...currentState?.memberID?.appearance,
                        idBackgroundColor: DEFAULT_COLOR_LIGHT,
                        fontColor: DEFAULT_COLOR_DARK,
                        dimIdBackgroundImage: true,
                    },
                },
            };
        }

        return {
            ...currentState,
            appearance: {
                ...currentState?.appearance,
                idBackgroundColor: DEFAULT_COLOR_LIGHT,
                fontColor: DEFAULT_COLOR_DARK,
            },
        };
    }

    return {
        ...currentState,
    };
};

export const getActiveAppearanceTab = (state: TroopsCMSState, viewMode: TroopsCMSViewModeEnum) => {
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const appearance = isInMemberViewMode ? state?.memberID?.appearance : state?.appearance;

    if (isInMemberViewMode) {
        return {
            ...state,
            memberID: {
                ...state.memberID,
                appearance: {
                    ...appearance,
                    activeAppearanceTab: convertColorToTab(appearance?.idBackgroundColor),
                },
            },
        };
    }

    return {
        ...state,
        appearance: {
            ...appearance,
            activeAppearanceTab: convertColorToTab(appearance?.idBackgroundColor),
        },
    };
};
