# learn-cloud-console — Agent Guide

Operator-facing dashboard for EducationOS / LearnCloud Console (ADR-001). Read the
[README](./README.md) for how to run it (console-bff + Vite dev server).

## Visual North Star (NON-NEGOTIABLE)

The UX of this app must **look identical** to the lovable prototype at
`EducationOS/educationos` (separate repo:
`/Users/jackson/Documents/Projects/LEStudios/EducationOS/educationos`), even though the
mechanics here are real (tRPC → console-bff) while the prototype is mocked.

**When building any new page or component, first read the corresponding prototype file**
(`src/pages/dashboard/*`, `src/components/*`) and replicate its visuals. Where the
prototype changes, this app follows.

Key reference files in the prototype:

| Concern            | Prototype file                        | Our equivalent                                       |
| ------------------ | ------------------------------------- | ---------------------------------------------------- |
| Sidebar            | `src/components/DashboardSidebar.tsx` | `src/components/Sidebar.tsx`                         |
| Header / app shell | `src/components/DashboardLayout.tsx`  | `src/components/Layout.tsx`                          |
| Design tokens      | `src/index.css`, `tailwind.config.ts` | `src/styles.css`, `tailwind.config.ts` (already 1:1) |

## Design Tokens

All colors are HSL CSS variables in `src/styles.css`, exposed through
`tailwind.config.ts`. **Never use generic Tailwind palette colors** (`gray-500`,
`blue-600`, ...). Use tokens:

-   Semantic: `background`, `foreground`, `card`, `muted`, `muted-foreground`, `border`,
    `primary` (navy), `secondary` (emerald), `accent` (lc-blue), `destructive` (lc-pink)
-   Brand: `navy` / `navy-light` / `navy-dark`, `emerald` (+`-light`/`-dark`), `teal`,
    `violet`, `coral`, `gold`, `lc-blue`, `lc-pink`, `lc-lime`, `lc-cyan`
-   Sidebar-scoped: `sidebar`, `sidebar-foreground`, `sidebar-accent`,
    `sidebar-accent-foreground`, `sidebar-border`
-   Shadows: `.shadow-card`, `.shadow-elevated`; gradients: `.bg-hero`,
    `.bg-accent-gradient`, `.text-gradient-brand`

These token values are copied from the prototype — do not change them here; if the
prototype's tokens change, mirror the change.

## Typography

-   Body: **Inter** (`font-sans`, the default)
-   Headings & display: **Space Grotesk** — `h1`–`h4` get it automatically via
    `styles.css`; use `font-display` for non-heading display text
-   Sidebar nav items: `text-[13px]`
-   Page titles: `font-display text-2xl md:text-3xl font-bold` style headings, subtitle in
    `text-muted-foreground`

## App Shell Conventions

-   **Sidebar** (`src/components/Sidebar.tsx`): 16rem expanded / 3rem collapsed
    (icon-only), `bg-sidebar` + `border-sidebar-border`. Items are `h-8 rounded-md
text-[13px]` with `h-4 w-4` lucide icons; active item is `text-lc-blue font-medium`
    (icon too). Collapsible groups (Apps / Plugins / Data) use `bg-lc-blue/10
hover:bg-lc-blue/15` triggers with a `ChevronRight h-3 w-3` that rotates 90° when
    open; only one group open at a time; content indented `pl-3`. No radix / shadcn
    deps — plain React state + `cn()` from `src/lib/utils.ts`. Navigation uses
    **wouter** (`Link`, `useLocation`); active state derives from the URL, and the
    route table in `src/routes.ts` is the single source of truth shared by the sidebar
    and `App.tsx` routes.

## Routing: wouter, NOT react-router (IMPORTANT)

This app uses [wouter](https://github.com/molefrog/wouter) (`Switch`/`Route`/`Redirect`/
`Link href=...`/`useLocation`). **Never add react-router / react-router-dom here**: the
monorepo root `package.json` has `overrides` pinning `react-router` and
`react-router-dom` to **5.3.3** (required by Ionic in `learn-card-app`/`scouts`). Those
overrides rewrite even transitive deps, so any v6+ install silently regresses to v5 on
the next `bun install` and breaks at runtime. wouter has no name collision with the
override, so it is safe. Note the prototype uses react-router — translate its `NavLink`/
`Route` patterns to wouter equivalents when porting pages (visuals stay identical).

-   **Header** (`src/components/Layout.tsx`): `h-14 bg-card border-b`, persona block on
    the right (`text-sm font-medium` name over `text-[10px] text-muted-foreground` role)
    -   circular `bg-emerald/10 text-emerald` avatar. When the sidebar is collapsed the
        logo + DEMO badge move into the header.
-   **Main**: `flex-1 bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden max-w-full` —
    full width, no `max-w-*` centering.
-   **Logo**: `src/assets/eduos-horizontal-black.png` (copied from the prototype), always
    paired with the outline DEMO badge (`text-[9px]`/`text-[10px]`, `border-primary/30
text-primary`).

## Component Conventions

-   UI primitives live in `src/components/ui/` (`card`, `badge`, `button`, `dialog`, `input`) — shadcn-style
    class strings, no runtime deps. Extend this folder rather than inlining long class
    strings; when adding a primitive, copy the prototype's version and strip
    radix/`cva` dependencies if needed.
-   Buttons: use `variant="hero"` for prominent "Add" actions (matches prototype's gradient/shadow style).
-   Cards: `Card` + `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`; titles
    render in Space Grotesk automatically.
-   Status badges: use `Badge` variants (`success`, `warning`, `destructive`, `outline`).
-   Icons: **lucide-react only**, `h-4 w-4` in nav/buttons. No emoji.
-   Code style: 4-space indentation, named exports, strict TS (no `as any` /
    `@ts-ignore`), types inferred from the server router where possible.

## Mechanics (don't break these while styling)

-   All data flows through tRPC at `/trpc` (`src/trpc.ts`); `DashboardSession` and other
    types are **inferred from `@console-bff/trpc/router`** — never hand-write API types.
-   Auth is cookie-based via the Vite proxy (`/auth`, `/p`, `/trpc` → console-bff). Keep
    everything same-origin.
-   New feature pages = a console-bff tRPC procedure + a page here, styled after the
    matching prototype page.

## Verification

-   `bun run typecheck` must pass before any change is complete.
-   For visual changes, compare against the prototype rendering (run the prototype with
    `bun run dev` in its repo, or compare against its source classes) — class strings
    should match the prototype wherever the same element exists.
