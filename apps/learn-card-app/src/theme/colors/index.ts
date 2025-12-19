import { ThemeEnum } from '../helpers/theme-helpers';
import { CredentialCategoryEnum } from 'learn-card-base';

export type CategoryColor = {
    primaryColor?: string;
    secondaryColor?: string;
    indicatorColor?: string;
    borderColor?: string;

    // category page colors
    statusBarColor?: string;
    headerTextColor?: string;
    headerBrandingTextColor?: string;
    backgroundPrimaryColor?: string; // header
    backgroundSecondaryColor?: string; // content
    tabActiveColor?: string;
};

// Colors for non-category launchpad items
export type LaunchPadColors = {
    contacts: { color: string };
    aiSessions: { color: string };
    alerts: { color: string; indicatorTextColor?: string; indicatorBgColor?: string };
    buttons: {
        connected: string;
        unconnected: string;
    };
};

export type SideMenuColors = {
    linkActiveColor: string;
    linkInactiveColor: string;
    linkActiveBackgroundColor: string;
    linkInactiveBackgroundColor: string;
    primaryButtonColor: string;
    secondaryButtonColor: string;
    indicatorColor: string;
    syncingColor: string;
    completedColor: string;
};

export type NavBarColors = {
    activeColor: string;
    inactiveColor: string;
    syncingColor: string;
    completedColor: string;
};

export type SpilledCupColors = {
    backsplash: string;
    spill: string;
    cupOutline: string;
};

export type PlaceholderCategoryKey = CredentialCategoryEnum | 'defaults';

export type PlaceholderCategoryMap = {
    [K in PlaceholderCategoryKey]?: {
        spilledCup: SpilledCupColors;
    };
};

export type DefaultColors = {
    primaryColor: string;
    primaryColorShade: string;
    loaders: string[];
};

// Per-theme color table: category colors + launchPad colors + placeholders
export type ThemeColorTable = Partial<Record<CredentialCategoryEnum, CategoryColor>> & {
    launchPad: LaunchPadColors;
    sideMenu: SideMenuColors;
    navbar?: NavBarColors;
    placeholders?: PlaceholderCategoryMap;
    defaults: DefaultColors;
};

export enum ColorSetEnum {
    launchPad = 'launchPad',
    sideMenu = 'sideMenu',
    navbar = 'navbar',
    placeholders = 'placeholders',
    defaults = 'defaults',
}

export type ColorSetByEnum = {
    [ColorSetEnum.launchPad]: LaunchPadColors;
    [ColorSetEnum.sideMenu]: SideMenuColors;
    [ColorSetEnum.navbar]: NavBarColors;
    [ColorSetEnum.placeholders]: PlaceholderCategoryMap;
    [ColorSetEnum.defaults]: DefaultColors;
};

export type ThemeColors = Record<ThemeEnum, ThemeColorTable>;

export const colors = {
    [ThemeEnum.Colorful]: {
        [CredentialCategoryEnum.aiTopic]: {
            primaryColor: 'cyan-301',
            secondaryColor: 'cyan-501',
            indicatorColor: 'indigo-500',
            borderColor: 'cyan-301',

            statusBarColor: 'cyan-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-cyan-400',
            backgroundSecondaryColor: 'cyan-200',
        },
        [CredentialCategoryEnum.aiPathway]: {
            primaryColor: 'teal-300',
            secondaryColor: 'teal-500',
            indicatorColor: 'indigo-500',
            borderColor: 'teal-500',

            statusBarColor: 'teal-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-teal-400',
            backgroundSecondaryColor: 'teal-200',
        },
        [CredentialCategoryEnum.aiInsight]: {
            primaryColor: 'lime-300',
            secondaryColor: 'lime-500',
            indicatorColor: 'indigo-500',
            borderColor: 'lime-300',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-900',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.skill]: {
            primaryColor: 'violet-300',
            secondaryColor: 'violet-500',
            indicatorColor: 'lime-200',
            borderColor: 'violet-300',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-900',
            backgroundPrimaryColor: '!bg-white',
            // backgroundSecondaryColor: 'violet-200',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.socialBadge]: {
            primaryColor: 'blue-300',
            secondaryColor: 'blue-500',
            indicatorColor: 'cyan-101',
            borderColor: 'blue-300',

            statusBarColor: 'blue-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-blue-400',
            backgroundSecondaryColor: 'blue-200',
            tabActiveColor: 'bg-blue-300',
        },
        [CredentialCategoryEnum.achievement]: {
            primaryColor: 'pink-300',
            secondaryColor: 'pink-500',
            indicatorColor: 'yellow-200',
            borderColor: 'pink-300',

            statusBarColor: 'pink-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-pink-400',
            backgroundSecondaryColor: 'pink-200',
            tabActiveColor: 'bg-pink-300',
        },
        [CredentialCategoryEnum.learningHistory]: {
            primaryColor: 'emerald-401',
            secondaryColor: 'emerald-601',
            indicatorColor: 'lime-200',
            borderColor: 'emerald-401',

            statusBarColor: 'emerald-401',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-emerald-401',
            backgroundSecondaryColor: 'emerald-200',
            tabActiveColor: 'bg-emerald-300',
        },
        [CredentialCategoryEnum.accomplishment]: {
            primaryColor: 'yellow-300',
            secondaryColor: 'yellow-500',
            indicatorColor: 'emerald-501',
            borderColor: 'yellow-300',

            statusBarColor: 'yellow-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-yellow-400',
            backgroundSecondaryColor: 'yellow-200',
            tabActiveColor: 'bg-yellow-300',
        },
        [CredentialCategoryEnum.accommodation]: {
            primaryColor: 'violet-300',
            secondaryColor: 'violet-500',
            indicatorColor: 'pink-500',
            borderColor: 'violet-300',

            statusBarColor: 'violet-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-violet-400',
            backgroundSecondaryColor: 'violet-200',
            tabActiveColor: 'bg-violet-300',
        },
        [CredentialCategoryEnum.workHistory]: {
            primaryColor: 'cyan-401',
            secondaryColor: 'cyan-601',
            indicatorColor: 'yellow-200',
            borderColor: 'cyan-401',

            statusBarColor: 'cyan-401',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-cyan-401',
            backgroundSecondaryColor: 'cyan-200',
            tabActiveColor: 'bg-cyan-400',
        },
        [CredentialCategoryEnum.family]: {
            primaryColor: 'amber-400',
            secondaryColor: 'amber-600',
            indicatorColor: 'cyan-501',
            borderColor: 'amber-400',

            statusBarColor: 'amber-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-amber-400',
            backgroundSecondaryColor: 'amber-200',
            tabActiveColor: 'bg-amber-300',
        },
        [CredentialCategoryEnum.id]: {
            primaryColor: 'blue-300',
            secondaryColor: 'blue-500',
            indicatorColor: 'pink-500',
            borderColor: 'blue-300',

            statusBarColor: 'blue-400',
            headerBrandingTextColor: 'text-white',
            headerTextColor: 'text-white',
            backgroundPrimaryColor: '!bg-blue-400',
            backgroundSecondaryColor: 'blue-200',
            tabActiveColor: 'bg-blue-300',
        },

        launchPad: {
            contacts: {
                color: 'teal-700',
            },
            aiSessions: {
                color: 'indigo-500',
            },
            alerts: {
                color: 'pink-600',
                indicatorTextColor: 'text-pink-600',
                indicatorBgColor: 'bg-white',
            },
            buttons: {
                unconnected: 'bg-indigo-500 text-white',
                connected: 'bg-grayscale-100 text-indigo-500',
            },
        },

        sideMenu: {
            linkActiveColor: 'text-grayscale-900',
            linkInactiveColor: 'text-grayscale-700',
            linkActiveBackgroundColor: 'bg-grayscale-100/50',
            linkInactiveBackgroundColor: 'bg-white',
            primaryButtonColor: 'bg-indigo-500 text-white',
            secondaryButtonColor: 'bg-gradient-rainbow text-white border-white',
            indicatorColor: 'text-rose-500',
            syncingColor: '!text-indigo-500',
            completedColor: '!text-emerald-700',
        },

        navbar: {
            activeColor: 'text-grayscale-900',
            inactiveColor: 'text-grayscale-600',
            syncingColor: '!text-indigo-500',
            completedColor: '!text-emerald-700',
        },

        placeholders: {
            [CredentialCategoryEnum.socialBadge]: {
                spilledCup: {
                    backsplash: '#93C5FD', // blue-300
                    spill: '#0891B2', // cyan-600
                    cupOutline: '#1D4ED8', // blue-700
                },
            },
            [CredentialCategoryEnum.learningHistory]: {
                spilledCup: {
                    backsplash: '#34D399', // emerald-401
                    spill: '#A3E635', // lime-400
                    cupOutline: '#047857', // emerald-701
                },
            },
            [CredentialCategoryEnum.achievement]: {
                spilledCup: {
                    backsplash: '#F9A8D4', // pink-300
                    spill: '#CA8A04', // ?
                    cupOutline: '#BE185D', // pink-700
                },
            },
            [CredentialCategoryEnum.accomplishment]: {
                spilledCup: {
                    backsplash: '#FDE047', // yellow-300
                    spill: '#34D399', // emerald-401
                    cupOutline: '#A16207', // yellow-700
                },
            },
            [CredentialCategoryEnum.workHistory]: {
                spilledCup: {
                    backsplash: '#22D3EE', // cyan-401
                    spill: '#EAB308', // yellow-500
                    cupOutline: '#0E7490', // cyan-701
                },
            },
            [CredentialCategoryEnum.accommodation]: {
                spilledCup: {
                    backsplash: '#C4B5FD', // violet-300
                    spill: '#EC4899', // pink-500
                    cupOutline: '#5B21B6', // ?
                },
            },
            [CredentialCategoryEnum.id]: {
                spilledCup: {
                    backsplash: '#93C5FD', // blue-300
                    spill: '#EC4899', // pink-500
                    cupOutline: '#1E40AF', // ?
                },
            },
            [CredentialCategoryEnum.family]: {
                spilledCup: {
                    backsplash: '#FBBF24', // amber-400
                    spill: '#22D3EE', // cyan-401
                    cupOutline: '#92400E', // amber-800
                },
            },
            [CredentialCategoryEnum.skill]: {
                spilledCup: {
                    backsplash: '#C4B5FD', // violet-300
                    spill: '#EC4899', // pink-500
                    cupOutline: '#5B21B6', // ?
                },
            },
            defaults: {
                spilledCup: {
                    backsplash: '#FBCFE8',
                    spill: '#E879F9',
                    cupOutline: '#A21CAF', // graycale-800
                },
            },
        },

        defaults: {
            primaryColor: 'indigo-500',
            primaryColorShade: 'indigo-200',
            loaders: [
                '#8B5CF6', // violet 500
                '#06B6D4', // cyan 500
                '#059669', // emerald 600
                '#3B82F6', // blue 500
            ],
        },
    },
    [ThemeEnum.Formal]: {
        [CredentialCategoryEnum.aiTopic]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.aiPathway]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.aiInsight]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.skill]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
        },
        [CredentialCategoryEnum.socialBadge]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.achievement]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.learningHistory]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.accomplishment]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.accommodation]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.workHistory]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.family]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },
        [CredentialCategoryEnum.id]: {
            primaryColor: 'off-white-50',
            secondaryColor: 'grayscale-800',
            indicatorColor: 'emerald-500',
            borderColor: 'grayscale-100',

            statusBarColor: 'light',
            headerBrandingTextColor: 'text-grayscale-800',
            headerTextColor: 'text-grayscale-800',
            backgroundPrimaryColor: '!bg-white',
            backgroundSecondaryColor: 'grayscale-100',
            tabActiveColor: 'bg-grayscale-200',
        },

        launchPad: {
            contacts: {
                color: 'grayscale-800',
            },
            aiSessions: {
                color: 'grayscale-800',
            },
            alerts: {
                color: 'grayscale-800',
                indicatorTextColor: 'text-emerald-500',
                indicatorBgColor: 'bg-emerald-50',
            },
            buttons: {
                unconnected: 'bg-blue-500 text-white',
                connected: 'bg-grayscale-100 text-blue-500',
            },
        },

        sideMenu: {
            linkActiveColor: 'text-grayscale-900',
            linkInactiveColor: 'text-grayscale-500',
            linkActiveBackgroundColor: 'bg-grayscale-100/50',
            linkInactiveBackgroundColor: 'bg-white',
            primaryButtonColor: 'bg-grayscale-800 text-white',
            secondaryButtonColor: 'bg-blue-500 text-white border-blue-500',
            indicatorColor: 'text-emerald-500',
            syncingColor: '!text-blue-500',
            completedColor: '!text-emerald-700',
        },

        navbar: {
            activeColor: 'text-grayscale-900',
            inactiveColor: 'text-grayscale-500',
            syncingColor: '!text-blue-500',
            completedColor: '!text-emerald-700',
        },

        placeholders: {
            [CredentialCategoryEnum.socialBadge]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.learningHistory]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.achievement]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.accomplishment]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.workHistory]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.accommodation]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.id]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.family]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
            [CredentialCategoryEnum.skill]: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },

            defaults: {
                spilledCup: {
                    backsplash: '#E2E3E9', // grayscale-200-line
                    spill: '#3B82F6', // blue-500
                    cupOutline: '#353E64', // graycale-800
                },
            },
        },

        defaults: {
            primaryColor: 'blue-500',
            primaryColorShade: 'blue-200',
            loaders: ['#353E64'],
        },
    },
};
