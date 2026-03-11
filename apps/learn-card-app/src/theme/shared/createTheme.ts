import type { Theme, ThemeCategory, SideMenuLink, NavbarLink } from '../validators/theme.validators';
import type { ThemeDefaults } from '../validators/theme.validators';
import { validateThemeData } from '../validators/theme.validators';

import { DEFAULT_CATEGORIES } from './defaultCategories';
import {
    DEFAULT_SIDE_MENU_ROOT_LINKS,
    DEFAULT_SIDE_MENU_SECONDARY_LINKS,
    DEFAULT_NAVBAR,
} from './defaultNavLinks';

// ─── Theme config type ──────────────────────────────────────────────────

/**
 * Input config for `createTheme`. Only `id`, `name`, `displayName`, `colors`,
 * `icons`, `styles`, and `defaults` are required. Everything else falls back
 * to the shared defaults.
 *
 * Pass `categories`, `sideMenuRootLinks`, `sideMenuSecondaryLinks`, or
 * `navbar` to override the defaults for tenant-specific customizations.
 */
export interface CreateThemeConfig {
    /** Theme identifier — must match a value in ThemeEnum */
    id: string;

    /** Internal name (lowercase, no spaces) */
    name: string;

    /** Human-readable label shown in the theme selector UI */
    displayName: string;

    /**
     * Full color table (category colors + launchPad + sideMenu + navbar + placeholders + defaults).
     * Accepts a permissive type because the Zod schema validates at runtime.
     */
    colors: Theme['colors'] | Record<string, unknown>;

    /**
     * Full icon table (category icons + launchPad + sideMenu + navbar + placeholders).
     * Accepts a permissive type because the Zod schema validates at runtime.
     */
    icons: Theme['icons'] | Record<string, unknown>;

    /** Style overrides (wallet card sizes, launchpad text, tabs) */
    styles: Theme['styles'];

    /** Default view settings + switcher/blocks icons */
    defaults: ThemeDefaults;

    /** Override default category labels. Falls back to DEFAULT_CATEGORIES. */
    categories?: ThemeCategory[];

    /** Override root side menu links. Falls back to DEFAULT_SIDE_MENU_ROOT_LINKS. */
    sideMenuRootLinks?: SideMenuLink[];

    /** Override secondary side menu links. Falls back to DEFAULT_SIDE_MENU_SECONDARY_LINKS. */
    sideMenuSecondaryLinks?: SideMenuLink[];

    /** Override mobile navbar links. Falls back to DEFAULT_NAVBAR. */
    navbar?: NavbarLink[];
}

// ─── Factory ────────────────────────────────────────────────────────────

/**
 * Create and validate a Theme from a minimal config.
 *
 * Shared boilerplate (categories, nav links) is filled in from defaults.
 * The theme is validated against `ThemeSchema` at creation time so any
 * missing or invalid fields fail fast.
 */
export const createTheme = (config: CreateThemeConfig): Theme => {
    return validateThemeData({
        id: config.id,
        name: config.name,
        displayName: config.displayName,
        colors: config.colors,
        icons: config.icons,
        styles: config.styles,
        defaults: config.defaults,
        categories: config.categories ?? DEFAULT_CATEGORIES,
        sideMenuRootLinks: config.sideMenuRootLinks ?? DEFAULT_SIDE_MENU_ROOT_LINKS,
        sideMenuSecondaryLinks: config.sideMenuSecondaryLinks ?? DEFAULT_SIDE_MENU_SECONDARY_LINKS,
        navbar: config.navbar ?? DEFAULT_NAVBAR,
    });
};
