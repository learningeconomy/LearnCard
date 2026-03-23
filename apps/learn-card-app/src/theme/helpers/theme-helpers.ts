/**
 * @deprecated Legacy enum used only as keys for the compiled icon/color/style
 * tables in `icons/index.tsx`, `colors/index.ts`, `styles/index.ts`.
 *
 * JSON-based themes (the current system) use string-keyed `ICON_SETS` in
 * `iconSets.ts` instead and don't need entries here. New themes should be
 * added as `schemas/{id}/theme.json` files — not as new enum members.
 */
export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}
