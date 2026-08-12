/**
 * Color palette for parameterized SVG icons.
 *
 * Theme JSON files can specify these per-category to recolor icons
 * without creating a new icon set. The `iconSet` field picks the
 * shape style (e.g. "colorful", "formal"), while `iconPalettes`
 * supplies the colors.
 */
export type IconPalette = {
    /** Main fill color (shape background in colorful, sole color in formal) */
    primary: string;

    /** Lighter variant of primary (used in WithLightShape variants) */
    primaryLight?: string;

    /** Secondary decorative fill color */
    accent?: string;

    /** Outline / stroke color */
    stroke?: string;
};
