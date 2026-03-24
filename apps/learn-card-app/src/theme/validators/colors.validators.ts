import { z } from 'zod';
import { CredentialCategoryEnum } from 'learn-card-base';

/**
 * Color fields use different Tailwind conventions depending on where they
 * are consumed in components. The three conventions are:
 *
 * 1. **Bare token** — a Tailwind color token WITHOUT a utility prefix.
 *    Components interpolate it: `bg-${primaryColor}`, `text-${indicatorColor}`.
 *    Example values: `"cyan-301"`, `"indigo-500"`, `"grayscale-800"`.
 *
 * 2. **Full utility class** — a complete Tailwind class string with prefix.
 *    Components use it directly in `className`.
 *    Example values: `"text-white"`, `"!bg-cyan-400"`, `"bg-blue-300"`.
 *
 * 3. **Raw hex** — a CSS hex color value (used only in `placeholders`).
 *    Passed directly to SVG fill/stroke props.
 *    Example values: `"#93C5FD"`, `"#353E64"`.
 */
export const CategoryColorSchema = z
    .object({
        /** Bare token — used as `bg-${primaryColor}`. E.g. `"cyan-301"` */
        primaryColor: z.string().optional().describe('Bare Tailwind token for primary bg'),

        /** Bare token — used as `bg-${secondaryColor}`. E.g. `"cyan-501"` */
        secondaryColor: z.string().optional().describe('Bare Tailwind token for secondary bg'),

        /** Bare token — used as `text-${indicatorColor}`. E.g. `"indigo-500"` */
        indicatorColor: z.string().optional().describe('Bare Tailwind token for indicator icon'),

        /** Bare token — used as `border-${borderColor}`. E.g. `"cyan-301"` */
        borderColor: z.string().optional().describe('Bare Tailwind token for border'),

        /** Bare token or `"light"` — Capacitor StatusBar color. E.g. `"cyan-400"`, `"light"` */
        statusBarColor: z.string().optional().describe('Bare token or "light" for status bar'),

        /** Full utility class — applied directly. E.g. `"text-white"`, `"text-grayscale-900"` */
        headerBrandingTextColor: z.string().optional().describe('Full Tailwind text class for header branding'),

        /** Full utility class — applied directly. E.g. `"text-white"` */
        headerTextColor: z.string().optional().describe('Full Tailwind text class for header text'),

        /** Full utility class — applied directly. E.g. `"!bg-cyan-400"`, `"!bg-white"` */
        backgroundPrimaryColor: z.string().optional().describe('Full Tailwind bg class for header background'),

        /** Bare token — used as `bg-${backgroundSecondaryColor}`. E.g. `"cyan-200"` */
        backgroundSecondaryColor: z.string().optional().describe('Bare Tailwind token for content background'),

        /** Full utility class — applied directly. E.g. `"bg-blue-300"` */
        tabActiveColor: z.string().optional().describe('Full Tailwind bg class for active tab'),
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
        /** Tailwind text-color class for the inline SVG text logo (e.g. "text-grayscale-900"). */
        logoColor: z.string().optional().describe('Text color for the inline SVG text logo'),
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

export const introSlidesColorsSchema = z.object({
    firstSlideBackground: z.string(),
    secondSlideBackground: z.string(),
    thirdSlideBackground: z.string(),
    textColors: z.object({
        primary: z.string(),
        secondary: z.string(),
    }),
    pagination: z.object({
        primary: z.string(),
        secondary: z.string(),
    }),
});

export const defaultColorsSchema = z.object({
    primaryColor: z.string(),
    primaryColorShade: z.string(),
    loaders: z.array(z.string()),

    /** Hex color for the login page background. Undefined = loaders[0] fallback. */
    loginBgColor: z.string().optional(),

    /** Hex color for login page button background. Undefined = grayscale-900. */
    loginButtonBgColor: z.string().optional(),

    /** Hex color for login page button text. Undefined = white. */
    loginButtonTextColor: z.string().optional(),

    /** Hex color for the Passport page background. Undefined = white. */
    passportBgColor: z.string().optional(),

    /** Tailwind text class for Passport heading text. Undefined = text-grayscale-900. */
    passportTextColor: z.string().optional(),

    /** Hex color for featured card backgrounds (checklist, resume builder). Undefined = white. */
    featuredCardBgColor: z.string().optional(),

    /** Tailwind text class for featured card text. Undefined = text-grayscale-900. */
    featuredCardTextColor: z.string().optional(),

    /** Hex color for Passport category card backgrounds. Undefined = use category primaryColor class. */
    passportCardBgColor: z.string().optional(),

    /** Tailwind text class for Passport category card labels. Undefined = text-grayscale-900. */
    passportCardTextColor: z.string().optional(),
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
        introSlides: introSlidesColorsSchema.describe('Intro Slides colors'),
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
                key === 'introSlides' ||
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
