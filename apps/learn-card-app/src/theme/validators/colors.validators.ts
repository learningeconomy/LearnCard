import { z } from 'zod';
import { CredentialCategoryEnum } from 'learn-card-base';

export const CategoryColorSchema = z
    .object({
        primaryColor: z.string().optional().describe('Primary category color'),
        secondaryColor: z.string().optional().describe('Secondary category color'),
        indicatorColor: z.string().optional().describe('Notification indicator color'),
        borderColor: z.string().optional().describe('Border color'),

        statusBarColor: z.string().optional().describe('Status bar color'),
        headerBrandingTextColor: z.string().optional().describe('Header branding text color'),
        headerTextColor: z.string().optional().describe('Header text color'),
        backgroundPrimaryColor: z.string().optional().describe('Background primary color'),
        backgroundSecondaryColor: z.string().optional().describe('Background secondary color'),
        tabActiveColor: z.string().optional().describe('Tab active color'),
    })
    .describe('Credential Category Colors');
export type CategoryColor = z.infer<typeof CategoryColorSchema>;

export const LaunchPadItemColorSchema = z
    .object({
        color: z.string(),
        indicatorTextColor: z.string().optional(),
        indicatorBgColor: z.string().optional(),
    })
    .describe('Single LaunchPad color token');

export const LaunchPadColorsSchema = z
    .object({
        contacts: LaunchPadItemColorSchema.describe('Contacts color'),
        aiSessions: LaunchPadItemColorSchema.describe('AI Sessions color'),
        alerts: LaunchPadItemColorSchema.describe('Alerts color'),
        buttons: z.object({
            connected: z.string(),
            unconnected: z.string(),
        }),
    })
    .describe('LaunchPad Colors');
export type LaunchPadColors = z.infer<typeof LaunchPadColorsSchema>;

export const SideMenuColorsSchema = z
    .object({
        linkActiveColor: z.string().describe('Text/icon color for active link'),
        linkInactiveColor: z.string().describe('Text/icon color for inactive link'),
        linkActiveBackgroundColor: z.string().describe('Background for active link'),
        linkInactiveBackgroundColor: z.string().describe('Background for inactive link'),
        primaryButtonColor: z.string().describe('Primary button color'),
        secondaryButtonColor: z.string().describe('Secondary button color'),
        indicatorColor: z.string().describe('Notification indicator color'),
        syncingColor: z.string().describe('Syncing indicator color'),
        completedColor: z.string().describe('Completed indicator color'),
    })
    .describe('SideMenu Colors');
export type SideMenuColors = z.infer<typeof SideMenuColorsSchema>;

export const NavBarColorsSchema = z
    .object({
        activeColor: z.string().describe('Text/icon color for active link'),
        inactiveColor: z.string().describe('Text/icon color for inactive link'),
        syncingColor: z.string().describe('Text/icon color for syncing wallet'),
        completedColor: z.string().describe('Text/icon color for completed syncing'),
    })
    .describe('NavBar Colors');
export type NavBarColors = z.infer<typeof NavBarColorsSchema>;

export const spilledCupSchema = z.object({
    backsplash: z.string(),
    spill: z.string(),
    cupOutline: z.string(),
});

export const placeholderCategoryMapSchema = z.record(
    z.union([z.nativeEnum(CredentialCategoryEnum), z.literal('defaults')]),
    z
        .object({
            spilledCup: spilledCupSchema,
        })
        .optional()
);

export const placeholdersSchema = z.object({
    placeholders: placeholderCategoryMapSchema,
});

export const defaultColorsSchema = z.object({
    primaryColor: z.string(),
    primaryColorShade: z.string(),
    loaders: z.array(z.string()),
});

/**
 * ThemeColorsSchema:
 *  - requires "launchPad" and "sideMenu"
 *  - allows additional keys for categories via catchall(CategoryColorSchema)
 *  - validates additional keys are valid CredentialCategoryEnum values
 */
export const ThemeColorsSchema = z
    .object({
        launchPad: LaunchPadColorsSchema.describe('LaunchPad color mappings'),
        sideMenu: SideMenuColorsSchema.describe('SideMenu color mappings'),
        navbar: NavBarColorsSchema.describe('NavBar color mappings'),
        placeholders: placeholderCategoryMapSchema.describe('Placeholders'),
        defaults: defaultColorsSchema.describe('Default color mappings'),
    })
    .catchall(CategoryColorSchema)
    .superRefine((obj, ctx) => {
        const valid = new Set(Object.values(CredentialCategoryEnum) as string[]);
        for (const key of Object.keys(obj)) {
            if (
                key === 'launchPad' ||
                key === 'sideMenu' ||
                key === 'navbar' ||
                key === 'placeholders' ||
                key === 'defaults'
            )
                continue;
            if (!valid.has(key)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: [key],
                    message: `Invalid category key: ${key}`,
                });
            }
        }
    })
    .describe('Theme Colors keyed by CredentialCategoryEnum plus LaunchPad + SideMenu + NavBar');

export type ThemeColors = z.infer<typeof ThemeColorsSchema>;
