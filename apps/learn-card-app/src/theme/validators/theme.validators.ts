import { z } from 'zod';
import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import { CredentialCategoryEnum } from 'learn-card-base';
import { MobileNavBarLinks } from '../../components/mobile-nav-bar/MobileNavBar';
import { SideMenuLinksEnum } from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import { ThemeColorsSchema } from './colors.validators';
import { ThemeIconsSchema } from './icons.validators';
import { ThemeStylesSchema } from './styles.validators';

/* ========= Categories ========= */
export const ThemeCategoriesSchema = z
    .object({
        labels: z
            .object({ singular: z.string(), plural: z.string() })
            .describe('Credential Category Labels'),
        categoryId: z
            .nativeEnum(CredentialCategoryEnum)
            .describe('Unique Credential Category identifier'),
    })
    .describe('Theme Credential Category');
export type ThemeCategory = z.infer<typeof ThemeCategoriesSchema>;

/* ========= Defaults ========= */
export const ThemeDefaultsSchema = z
    .object({
        viewMode: z.nativeEnum(ViewMode).describe('View Modes for Credential Lists'),
        switcherIcon: z.string().describe('Theme Switcher Icon'),
        buildMyLCIcon: z.string().describe('Build My LearnCard Icon'),
    })
    .describe('Theme Defaults');
export type ThemeDefaults = z.infer<typeof ThemeDefaultsSchema>;

/* ========= SideMenu Links ========= */
export const SideMenuLinkSchema = z
    .object({
        id: z.nativeEnum(SideMenuLinksEnum).describe('SideMenu Link ID enum'),
        label: z.string().describe('Label for link'),
        path: z.string().describe('Path for link'),
    })
    .describe('SideMenu Link');
export type SideMenuLink = z.infer<typeof SideMenuLinkSchema>;

/* ========= Navbar Links ========= */
export const NavbarLinkSchema = z
    .object({
        id: z.nativeEnum(MobileNavBarLinks).describe('Navbar Link ID enum'),
        label: z.string().describe('Label for link'),
        path: z.string().describe('Path for link'),
    })
    .describe('Navbar Link');
export type NavbarLink = z.infer<typeof NavbarLinkSchema>;

/* ========= Theme ========= */
export const ThemeSchema = z
    .object({
        id: z.nativeEnum(ThemeEnum).describe('Theme ID enum'),
        name: z.string().describe('Internal theme name'),
        displayName: z.string().describe('Display name for UI'),
        colors: ThemeColorsSchema.describe('Color mappings by category + launchPad'),
        icons: ThemeIconsSchema.describe('Icon mappings by category + launchPad'),
        categories: z.array(ThemeCategoriesSchema).describe('Theme credential categories'),
        sideMenuRootLinks: z.array(SideMenuLinkSchema).describe('Theme side menu root links'),
        sideMenuSecondaryLinks: z
            .array(SideMenuLinkSchema)
            .describe('Theme side menu secondary links'),
        navbar: z.array(NavbarLinkSchema).describe('Theme navbar links'),
        defaults: ThemeDefaultsSchema.describe('Default view & layout settings'),
        styles: ThemeStylesSchema.describe('Per-theme style overrides (utility classes)'),
    })
    .describe('Theme Schema');
export type Theme = z.infer<typeof ThemeSchema>;

export const validateThemeData = (data: unknown): Theme => ThemeSchema.parse(data);

/* ========= Theme selector button ========= */
export const ThemeButtonSchema = z
    .object({
        theme: z.nativeEnum(ThemeEnum).describe('Theme identifier'),
        label: z.string().describe('Label for selector button'),
        icon: z.string().describe('Icon asset path or reference for selector button'),
    })
    .describe('Theme Button Schema');
export type ThemeButton = z.infer<typeof ThemeButtonSchema>;
