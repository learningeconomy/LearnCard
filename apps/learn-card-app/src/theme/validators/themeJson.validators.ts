/**
 * Zod schema for the raw `theme.json` files in `schemas/<themeId>/`.
 *
 * This validates the JSON shape BEFORE processing (inheritance resolution,
 * color expansion, icon wiring). For the fully processed Theme object,
 * see `ThemeSchema` in `theme.validators.ts`.
 *
 * Used by:
 *   - scripts/validate-theme-schemas.ts (CI validation)
 *   - loadJsonTheme.ts (runtime loading — can optionally pre-validate)
 */

import { z } from 'zod';

// ── Color sub-schemas ────────────────────────────────────────────────────

const categoryColorJsonSchema = z.record(z.string(), z.string());

const launchPadColorJsonSchema = z.record(z.string(), z.unknown());

const themeJsonColorsSchema = z.object({
    /** Uniform base applied to every credential category (formal-style). */
    categoryBase: categoryColorJsonSchema.optional(),

    /** Per-category overrides. Merged on top of categoryBase if both exist. */
    categories: z.record(z.string(), categoryColorJsonSchema).optional(),

    launchPad: launchPadColorJsonSchema.optional(),
    sideMenu: z.record(z.string(), z.string()).optional(),
    navbar: z.record(z.string(), z.string()).optional(),
    introSlides: z.record(z.string(), z.unknown()).optional(),

    /** Shorthand: a single placeholder applied to every category + defaults. */
    placeholderBase: z.record(z.string(), z.unknown()).optional(),

    /** Explicit per-category placeholders (colorful-style). */
    placeholders: z.record(z.string(), z.unknown()).optional(),

    defaults: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type ThemeJsonColors = z.infer<typeof themeJsonColorsSchema>;

// ── Icon palette sub-schema ──────────────────────────────────────────────

const iconPaletteJsonSchema = z.object({
    primary: z.string(),
    primaryLight: z.string().optional(),
    accent: z.string().optional(),
    stroke: z.string().optional(),
}).partial();

// ── Root theme.json schema ───────────────────────────────────────────────

export const ThemeJsonSchema = z.object({
    /** Theme ID — must match the containing directory name. */
    id: z.string(),

    /** Human-readable name shown in the ThemeSelector UI. */
    displayName: z.string(),

    /** Parent theme ID. All unset fields inherit from the parent. */
    extends: z.string().optional(),

    /** Icon set name (key into ICON_SETS). Defaults to parent's set. */
    iconSet: z.string().optional(),

    /** Per-category icon color overrides. */
    iconPalettes: z.record(z.string(), iconPaletteJsonSchema).optional(),

    /** Default view mode and layout settings. */
    defaults: z.object({
        viewMode: z.enum(['list', 'grid']).optional(),
    }).passthrough().optional(),

    /** Color definitions for all UI surfaces. */
    colors: themeJsonColorsSchema.optional(),

    /** Tailwind utility class overrides for specific components. */
    styles: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export type ThemeJsonConfig = z.infer<typeof ThemeJsonSchema>;

export const validateThemeJson = (data: unknown): ThemeJsonConfig =>
    ThemeJsonSchema.parse(data);

export const safeValidateThemeJson = (data: unknown) =>
    ThemeJsonSchema.safeParse(data);
