import { z } from 'zod';
import { CredentialCategoryEnum } from 'learn-card-base';

export const CategoryIconsSchema = z
    .object({
        Icon: z.any().optional().describe('React component for base icon'),
        IconWithShape: z.any().optional().describe('React component for shaped icon'),
        IconWithLightShape: z.any().optional().describe('React component for light shaped icon'),
    })
    .describe('Credential Category Icons');
export type CategoryIcons = z.infer<typeof CategoryIconsSchema>;

export const LaunchPadIconsSchema = z
    .object({
        contacts: z.any().describe('LaunchPad Contacts Icon'),
        aiSessions: z.any().describe('LaunchPad AI Sessions Icon'),
        alerts: z.any().describe('LaunchPad Alerts Icon'),
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
        launchPad: z.any().describe('SideMenu LaunchPad Icon'),
        contacts: z.any().describe('SideMenu Contacts Icon'),
        alerts: z.any().describe('SideMenu Alerts Icon'),
        personalize: z.any().describe('SideMenu Personalize Icon'),
        adminTools: z.any().describe('SideMenu Admin Tools Icon'),
        wallet: z.any().describe('SideMenu Wallet Icon'),
    })
    // allow additional keys, but validate they are category enums
    .catchall(z.any())
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
        wallet: z.any().describe('Navbar Wallet Icon'),
        plus: z.any().describe('Navbar Plus Icon'),
        launchPad: z.any().describe('Navbar LaunchPad Icon'),
    })
    .describe('Navbar Icons');
export type NavbarIcons = z.infer<typeof NavbarIconsSchema>;

export const PlaceholdersIconsSchema = z
    .object({
        floatingBottle: z.any().describe('Placeholder Empty Bottle Icon'),
        telescope: z.any().describe('Placeholder Telescope Icon'),
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
