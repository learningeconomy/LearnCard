# Theme JSON Format Reference

This document describes the structure and conventions for `theme.json` files in `src/theme/schemas/<themeId>/`.

## Directory Structure

```
src/theme/schemas/
├── colorful/
│   ├── theme.json          # Theme definition
│   └── assets/
│       ├── switcher-icon.png   # Icon shown in ThemeSelector
│       └── blocks-icon.png     # "Build My LearnCard" icon
├── formal/
│   ├── theme.json
│   └── assets/
│       ├── switcher-icon.png
│       └── blocks-icon.png
└── vetpass/
    ├── theme.json           # Extends "formal"
    └── assets/
        ├── switcher-icon.png
        └── blocks-icon.png
```

## theme.json Schema

```jsonc
{
    // REQUIRED — must match the directory name
    "id": "mytheme",

    // REQUIRED — shown in the ThemeSelector UI
    "displayName": "My Theme",

    // OPTIONAL — inherit all unset fields from another theme
    "extends": "formal",

    // OPTIONAL — which icon set to use: "colorful" | "formal"
    // Defaults to parent's iconSet, or "colorful" if no parent
    "iconSet": "formal",

    // OPTIONAL — override icon color palettes per category
    "iconPalettes": { ... },

    // OPTIONAL — default view mode and layout settings
    "defaults": { ... },

    // OPTIONAL — color definitions for all UI surfaces
    "colors": { ... },

    // OPTIONAL — Tailwind utility class overrides for specific components
    "styles": { ... }
}
```

## Inheritance (`extends`)

A theme can extend another theme by setting `"extends": "<parentId>"`. This performs a deep merge — the child only needs to specify values that differ from the parent.

```jsonc
// vetpass/theme.json — only overrides what differs from formal
{
    "id": "vetpass",
    "displayName": "VetPass",
    "extends": "formal",
    "colors": {
        "categoryBase": {
            "primaryColor": "teal-600"
            // All other categoryBase colors inherited from formal
        }
    }
}
```

- Circular extends are detected and will throw an error.
- The `id` and `displayName` of the child always win (never inherited).
- Multi-level inheritance works: A → B → C.

## Colors

The `colors` object controls colors across the entire app. It has several sub-sections:

### `categoryBase` — Uniform Base Colors

Applied to **every** credential category. Use this for themes where all categories share the same color scheme (e.g., formal/minimal themes).

```jsonc
"categoryBase": {
    "primaryColor": "cyan-301",
    "backgroundPrimaryColor": "!bg-cyan-400",
    "statusBarColor": "light"
}
```

### `categories` — Per-Category Overrides

Override specific categories on top of `categoryBase`. Keys are **camelCase enum keys** (not the spaced display strings).

```jsonc
"categories": {
    "aiTopic": {
        "primaryColor": "purple-500",
        "backgroundPrimaryColor": "!bg-purple-400"
    },
    "socialBadge": {
        "primaryColor": "pink-500"
    }
}
```

**Valid category keys:**

| JSON Key | Display Name | Enum Value |
|----------|-------------|------------|
| `aiTopic` | AI Sessions | `"AI Topic"` |
| `aiPathway` | AI Pathways | `"AI Pathway"` |
| `aiInsight` | AI Insights | `"AI Insight"` |
| `skill` | Skills | `"Skill"` |
| `socialBadge` | Boosts | `"Social Badge"` |
| `achievement` | Achievements | `"Achievement"` |
| `learningHistory` | Studies | `"Learning History"` |
| `accomplishment` | Portfolio | `"Accomplishment"` |
| `accommodation` | Assistance | `"Accommodation"` |
| `workHistory` | Experiences | `"Work History"` |
| `family` | Families | `"Family"` |
| `id` | IDs | `"ID"` |

### Color Value Formats

Theme JSON uses several color value formats depending on the context:

| Format | Example | Usage |
|--------|---------|-------|
| **Tailwind token** | `"cyan-301"` | Custom palette tokens defined in `tailwind.config.js` |
| **Tailwind utility** | `"!bg-cyan-400"` | Full Tailwind class (the `!` prefix means `!important`) |
| **Hex color** | `"#18224E"` | Direct hex values for non-Tailwind contexts |
| **Platform string** | `"light"` or `"dark"` | Status bar style (iOS/Android) |

> **Convention:** `primaryColor` fields typically use Tailwind tokens. `backgroundPrimaryColor` fields use Tailwind utility classes prefixed with `!bg-`. `statusBarColor` uses `"light"` or `"dark"`.

### `launchPad` — LaunchPad Section Colors

```jsonc
"launchPad": {
    "backgroundPrimaryColor": "!bg-slate-50",
    "contacts": { "iconBackgroundColor": "#E0F2FE", "iconColor": "#0284C7" },
    "aiSessions": { "iconBackgroundColor": "#F3E8FF", "iconColor": "#9333EA" },
    "alerts": { "iconBackgroundColor": "#DCFCE7", "iconColor": "#16A34A" }
}
```

### `sideMenu` — Side Navigation Colors

```jsonc
"sideMenu": {
    "backgroundColor": "#FFFFFF",
    "textColor": "#18224E",
    "activeTextColor": "#6366F1",
    "activeBackgroundColor": "#EEF2FF"
}
```

### `navbar` — Bottom Navigation Bar

```jsonc
"navbar": {
    "backgroundPrimaryColor": "#FFFFFF",
    "activeColor": "#18224E",
    "inactiveColor": "#8B91A7"
}
```

### `introSlides` — Onboarding Slide Backgrounds

```jsonc
"introSlides": {
    "backgroundColorSlide1": "#F0F9FF",
    "backgroundColorSlide2": "#F0FDF4",
    "backgroundColorSlide3": "#FFF7ED"
}
```

### `placeholderBase` vs `placeholders`

Use `placeholderBase` for a uniform empty-state style across all categories:

```jsonc
"placeholderBase": {
    "backgroundPrimaryColor": "!bg-slate-50",
    "iconColor": "#94A3B8"
}
```

Or `placeholders` for per-category empty states (the colorful theme uses this):

```jsonc
"placeholders": {
    "aiTopic": { "backgroundPrimaryColor": "!bg-purple-50", "iconColor": "#9333EA" },
    "skill": { "backgroundPrimaryColor": "!bg-blue-50", "iconColor": "#2563EB" }
}
```

### `defaults` — Default Color Values

```jsonc
"defaults": {
    "iconColor": "#64748B"
}
```

## Defaults

```jsonc
"defaults": {
    // "list" (default) or "grid" — initial wallet view mode
    "viewMode": "list"
}
```

The `switcherIcon` and `buildMyLCIcon` are resolved automatically from `assets/switcher-icon.png` and `assets/blocks-icon.png` in the theme's directory.

## Icon Palettes

Override icon colors for specific credential categories. Keys match the palette names in `WALLET_ICON_PALETTE_DEFAULTS`:

```jsonc
"iconPalettes": {
    "AiSessions": { "primary": "#7C3AED", "primaryLight": "#A78BFA" },
    "Skills": { "primary": "#2563EB", "accent": "#60A5FA" },
    "Boosts": { "primary": "#DB2777" }
}
```

**Available palette keys:** `AiSessions`, `AiPathways`, `AiInsights`, `Skills`, `Boosts`, `Achievements`, `Studies`, `Portfolio`, `Assistance`, `Experiences`, `Families`, `IDs`

**Palette fields:**
- `primary` — Main icon color
- `primaryLight` — Lighter variant (backgrounds, fills)
- `accent` — Secondary highlight color
- `stroke` — Outline/stroke color

Palettes are merged onto compiled defaults — you only need to specify the fields you're changing.

## Styles

Override Tailwind utility classes for specific UI components:

```jsonc
"styles": {
    "wallet": {
        "walletHeaderClass": "bg-white",
        "walleBorderClass": "border-b border-gray-200",
        "categoryCardClass": "rounded-xl shadow-sm"
    },
    "launchPad": {
        "headerClass": "bg-white",
        "borderClass": "border-b border-gray-200"
    }
}
```

## Required Assets

Each theme directory should contain:

| File | Purpose | Required? |
|------|---------|-----------|
| `assets/switcher-icon.png` | Icon in the ThemeSelector toggle | Yes |
| `assets/blocks-icon.png` | "Build My LearnCard" feature icon | Yes |

Themes that `extend` another theme can omit these — they'll inherit from the parent's resolved values.

## Validation

Run the theme validator to check all themes:

```bash
npx tsx scripts/validate-theme-schemas.ts
```

This checks:
- JSON structure validity
- `id` matches directory name
- `extends` references exist (no dangling/circular references)
- `iconSet` references a known icon set
- Required assets exist

The full runtime validation (`ThemeSchema.parse()`) happens at app boot when themes are loaded via `loadAllJsonThemes()`.

## Creating a New Theme

The easiest way is to use the interactive scaffolding tool:

```bash
pnpm create-tenant
# Select "Create a custom theme for this tenant" → Yes
```

Or manually:

1. Create `src/theme/schemas/<id>/theme.json`
2. Create `src/theme/schemas/<id>/assets/` with `switcher-icon.png` and `blocks-icon.png`
3. Set `"extends": "formal"` (or `"colorful"`) to inherit defaults
4. Override only the colors/styles you need
5. Run `pnpm validate-themes` to check validity
