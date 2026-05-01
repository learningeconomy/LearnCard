import { z } from 'zod';
import { CredentialCategoryEnum } from 'learn-card-base';

/**
 * Validates that a value looks like a React component (function or object)
 * or an image asset URL (string — e.g. a Vite-resolved PNG import).
 * Catches accidental `undefined` or `number` values that would only
 * surface as cryptic React render errors.
 */
const componentLike = z.unknown().refine(
    (v): v is React.FC | string =>
        typeof v === 'function' || typeof v === 'string' || (typeof v === 'object' && v !== null),
    { message: 'Expected a React component (function or object) or image URL (string)' },
);

export const CategoryIconsSchema = z
    .object({
        Icon: componentLike.optional().describe('React component for base icon'),
        IconWithShape: componentLike.optional().describe('React component for shaped icon'),
        IconWithLightShape: componentLike.optional().describe('React component for light shaped icon'),
    })
    .describe('Credential Category Icons');
export type CategoryIcons = z.infer<typeof CategoryIconsSchema>;

export const LaunchPadIconsSchema = z
    .object({
        contacts: componentLike.describe('LaunchPad Contacts Icon'),
        aiSessions: componentLike.describe('LaunchPad AI Sessions Icon'),
        alerts: componentLike.describe('LaunchPad Alerts Icon'),
    })
    .describe('LaunchPad Icons');
export type LaunchPadIcons = z.infer<typeof LaunchPadIconsSchema>;

/** SideMenu icons:
 *  - fixed required entries (launchPad, contacts, alerts, personalize, adminTools, wallet)
 *  - PLUS category entries keyed by CredentialCategoryEnum
 */
const sideMenuFixedKeys = [
    'launchPad',
    'contacts',
    'alerts',
    'personalize',
    'adminTools',
    'wallet',
] as const;

export const SideMenuIconsSchema = z
    .object({
        launchPad: componentLike.describe('SideMenu LaunchPad Icon'),
        contacts: componentLike.describe('SideMenu Contacts Icon'),
        alerts: componentLike.describe('SideMenu Alerts Icon'),
        personalize: componentLike.describe('SideMenu Personalize Icon'),
        adminTools: componentLike.describe('SideMenu Admin Tools Icon'),
        wallet: componentLike.describe('SideMenu Wallet Icon'),
    })
    .catchall(componentLike)
    .superRefine((obj, ctx) => {
        const fixed = new Set(sideMenuFixedKeys as readonly string[]);
        const validCats = new Set(Object.values(CredentialCategoryEnum) as string[]);
        for (const key of Object.keys(obj)) {
            if (fixed.has(key)) continue;
            if (!validCats.has(key)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [key],
                    message: `Invalid SideMenu category key: ${key}`,
                });
            }
        }
    })
    .describe('SideMenu Icons');
export type SideMenuIcons = z.infer<typeof SideMenuIconsSchema>;

export const NavbarIconsSchema = z
    .object({
        wallet: componentLike.describe('Navbar Wallet Icon'),
        plus: componentLike.describe('Navbar Plus Icon'),
        launchPad: componentLike.describe('Navbar LaunchPad Icon'),
    })
    .describe('Navbar Icons');
export type NavbarIcons = z.infer<typeof NavbarIconsSchema>;

export const PlaceholdersIconsSchema = z
    .object({
        floatingBottle: componentLike.describe('Placeholder Empty Bottle Icon'),
        telescope: componentLike.describe('Placeholder Telescope Icon'),
    })
    .describe('Placeholder Icons');
export type PlaceholdersIcons = z.infer<typeof PlaceholdersIconsSchema>;

/**
 *  - requires "launchPad" and "sideMenu"
 *  - allows additional top-level keys that must be valid CredentialCategoryEnum
 *    (those map to CategoryIconsSchema)
 */
export const ThemeIconsSchema = z
    .object({
        launchPad: LaunchPadIconsSchema.describe('LaunchPad Icons set'),
        sideMenu: SideMenuIconsSchema.describe('SideMenu icons (fixed + per-category)'),
        navbar: NavbarIconsSchema.describe('Navbar icons'),
        placeholders: PlaceholdersIconsSchema.describe('Placeholder icons'),
    })
    .catchall(CategoryIconsSchema)
    .superRefine((obj, ctx) => {
        const special = new Set(['launchPad', 'sideMenu', 'navbar', 'placeholders']);
        const validCats = new Set(Object.values(CredentialCategoryEnum) as string[]);
        for (const key of Object.keys(obj)) {
            if (special.has(key)) continue;
            if (!validCats.has(key)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [key],
                    message: `Invalid category key: ${key}`,
                });
            }
        }
    })
    .describe('Theme icons (category icons + launchPad + sideMenu)');
export type ThemeIcons = z.infer<typeof ThemeIconsSchema>;
