# Embed SDK UI Polish — Design Spec

**JIRA:** LC-1382
**Branch:** LC-1636
**Date:** 2026-03-11
**Status:** Approved

## Summary

Redesign the LearnCard Embed SDK modal to feel polished and professional. The current SDK is functional but visually plain — flat white box, no animations, basic form styling. This spec upgrades the visual design, adds branding elements, introduces animations and transitions, and adds loading/success states that build trust and delight.

All changes are scoped to `packages/learn-card-embed-sdk/`. No backend changes required.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Header style | Clean white with LC logo + "× Partner" | Partners want co-branding visibility; white keeps it neutral across partner sites |
| Credential card | Pastel teal-to-blue gradient with surface sweep shine | Draws attention to what's being claimed; shine animation adds premium feel without being distracting |
| Primary action color | #2EC4A5 (LearnCard teal) | Matches the LearnCard app branding; overridable via `branding.primaryColor`. **Note:** This changes the SDK default from `#1F51FF` (blue) to `#2EC4A5` (teal). Partners who don't set `branding.primaryColor` will see the new teal color. |
| Success celebration | Animated checkmark + CSS confetti | Rewarding moment that reinforces the value of claiming; pure CSS, no library needed |
| Loading state | Skeleton shimmer | Shows the modal is working before content loads; matches email view layout shape |
| View transitions | Slide-left with fade | Creates sense of forward progress through the claim flow |

## Scope

### In Scope

- Visual redesign of all 4 iframe views (email, OTP, accept, success)
- Modal outer chrome (header, footer, overlay)
- Credential preview card with shine animation
- Progress stepper dots
- Skeleton loading state
- Confetti + checkmark success animation
- View-to-view slide transitions
- Input focus states and button hover/active animations
- Button loading state (spinner + "Processing...")
- "Secured by LearnCard" footer with logo
- Branding color adaptation (primaryColor drives palette)
- Partner logo support in header

### Out of Scope

- Backend/API changes
- New SDK configuration options beyond existing `branding` tokens
- Changes to the claim flow logic or state machine
- Mobile-specific responsive breakpoints (modal is already 420px max-width)
- Accessibility audit (separate ticket)

## Architecture

All UI lives in two files that generate inline CSS + vanilla JS:

| File | Role | Changes |
|------|------|---------|
| `src/styles.ts` | CSS string generation for parent + iframe | Major rewrite: new layout classes, animation keyframes, CSS custom properties |
| `src/iframe/island-vanilla.js` | Vanilla JS component tree inside sandboxed iframe | Add credential card, progress dots, skeleton, confetti, view transitions, loading states |
| `src/index.ts` | Parent-side modal chrome | Update header (logo, partner logo, footer), modal styling, overlay animation |
| `src/types.ts` | TypeScript interfaces | No changes needed — existing `BrandingTokens` already covers all needed config |

### Constraints

- **Zero dependencies.** All animations are CSS-only or vanilla JS. No libraries.
- **Sandboxed iframe.** CSP: `style-src 'unsafe-inline'; script-src 'unsafe-inline'`. No external CSS or JS allowed.
- **`srcdoc` delivery.** All iframe content is an inline HTML string. Size budget: keep raw iframe HTML under 15KB; keep total built SDK output under 20KB gzipped.
- **ES2019 target.** No modern CSS that requires post-processing (but `@keyframes`, CSS custom properties, and `animation` are fine).

## Component Design

### 1. Modal Chrome

**Header (parent-side, `index.ts` + `styles.ts`):**
```
┌─────────────────────────────────────────┐
│ [LC Logo] × [Partner Logo/Name]     [✕] │
└─────────────────────────────────────────┘
```
- White background, 1px `#f0f0f0` bottom border
- LC logo: `branding.logoUrl` or default CDN URL (`https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb`), 26px height
- Partner logo: `branding.partnerLogoUrl` as `<img>` if provided, otherwise `opts.partnerName` (top-level `InitOptions` property, not on `BrandingTokens`) as text
- "×" separator: `#d1d5db` color
- Close button: `#f5f5f5` background, `#9ca3af` color, 6px border-radius

**Footer (iframe-side, `island-vanilla.js` + `styles.ts`):**

The footer renders inside the iframe, below the view content. It is part of the iframe's DOM, not the parent modal. The LC logo URL is passed into the iframe config alongside the nonce and other settings.

```
┌─────────────────────────────────────────┐
│        🔒 Secured by [LC Logo]          │
└─────────────────────────────────────────┘
```
- 1px `#f3f4f6` top border
- Lock icon (inline SVG) + "Secured by" text + LC logo `<img>` (13px height, 50% opacity)
- Logo URL passed via `window.__LC_EMBED__.logoUrl` (the same CDN default or `branding.logoUrl`)
- CSP allows `img-src https: data:` so loading the CDN image inside the iframe is fine
- Font: 11px, color `#b0b8c4`

**Modal overlay animation:**
- Backdrop: `rgba(0,0,0,0.45)` (unchanged)
- Modal entrance: `transform: scale(0.95); opacity: 0` → `transform: scale(1); opacity: 1` over 250ms with `cubic-bezier(0.16, 1, 0.3, 1)`

### 2. Progress Stepper (iframe)

Three dots connected by bars, centered above content:

```
  ●───────○───────○    (step 1: email)
  ✓───────●───────○    (step 2: OTP)
  ✓───────✓───────✓    (step 3: success)
```

- Dots: 8px circles. States: inactive (`#e5e7eb`), active (primaryColor + 3px glow ring at 18% opacity), done (`#10b981`)
- Bars: 24px × 2px. States: pending (`#e5e7eb`), done (`#10b981`)
- Transitions: 300ms ease on color + scale

**Step mapping:**
| View | Dot 1 | Dot 2 | Dot 3 |
|------|-------|-------|-------|
| email | active | - | - |
| otp | done | active | - |
| accept | (no stepper — credential card takes its visual position) | | |
| success (from email/otp flow) | done | done | done |
| success (from accept flow) | (no stepper — consistent with accept view having none) | | |

### 3. Credential Preview Card (iframe)

Shown on email view and accept view. Displays what the user is about to claim.

```
┌──────────────────────────────────┐
│  CREDENTIAL                      │  ← 11px uppercase, 40% opacity
│  Web Development Certificate     │  ← 17px bold
│  Issued by Acme Corp            │  ← 12px, 45% opacity (uses `opts.partnerName`)
│                          ✦ shine │
└──────────────────────────────────┘
```

**Styling:**
- Background: `linear-gradient(135deg, #e0faf3, #c4e8fb)` (default), adapts when `primaryColor` is set
- Color: `#0c3a2e` (dark teal text on pastel background)
- Border-radius: 12px
- Padding: 16px 18px
- Margin: 10px 16px 0

**Surface sweep shine animation:**
- Pseudo-element (`::after`): 40% width, 200% height diagonal stripe
- Gradient: transparent → `rgba(255,255,255,0.45)` → `rgba(255,255,255,0.6)` → transparent
- Rotated 25deg, sweeps left-to-right
- Duration: 3.5s, ease-in-out, infinite loop
- 60% pause between sweeps (animation holds at `left: 130%` from 40% to 100% of keyframes)

**Color adaptation for custom primaryColor:**
- Derive pastel gradient: lighten primaryColor to ~90% lightness for start, ~70% for end
- Implementation: Use a simple HSL-based helper or pre-compute light tint from hex

### 4. Email View (iframe)

```
  [Progress: ●───○───○]
  ┌─ Credential Card ──────────────┐
  │  ✦ shine                       │
  └────────────────────────────────┘

  Email address              ← label
  ┌────────────────────────────────┐
  │ you@example.com                │  ← input with focus ring
  └────────────────────────────────┘
  ┌────────────────────────────────┐
  │         Send Code →            │  ← primary button
  └────────────────────────────────┘
```

**Input focus state:** Border transitions to primaryColor (150ms) + 3px box-shadow ring at 10% opacity of primaryColor.

**Button states:**
- Default: primaryColor background, white text, `box-shadow: 0 4px 14px` at 25% opacity of primaryColor
- Hover: `translateY(-1px)`, shadow deepens to 35% opacity
- Active: `translateY(0)`, shadow returns to default
- Disabled: 50% opacity, no shadow, `cursor: not-allowed`
- Loading: Text crossfades to inline spinner SVG + "Sending..." (150ms)

### 5. OTP View (iframe)

```
  [Progress: ✓───●───○]

  Enter verification code          ← 18px bold
  We sent a code to alex@...       ← 13px gray

  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐
  │4 │ │7 │ │2 │ │  │ │  │ │  │  ← 6 OTP inputs
  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘

  ┌────────────────────────────────┐
  │           Verify               │
  └────────────────────────────────┘
  Didn't get it? Check spam...     ← hint
```

**OTP input states:**
- Empty: 2px `#e5e7eb` border, 10px border-radius (intentional bump from current 8px to match other inputs)
- Focused: border transitions to primaryColor + 3px glow ring
- Filled: border stays primaryColor, background `rgba(primaryColor, 0.04)`, micro scale pulse (1.03 → 1.0 over 150ms)

**No credential card on OTP view** — keeps it clean and focused on the code entry.

### 6. Accept View (iframe, returning user)

```
  ┌─ Credential Card ──────────────┐
  │  ✦ shine                       │
  └────────────────────────────────┘

  Signed in as alex@example.com

  ┌────────────────────────────────┐
  │     Accept Credential →        │
  └────────────────────────────────┘
       Use a different email       ← secondary text button
```

No progress stepper on accept view — the credential card takes its place visually.

### 7. Success View (iframe)

```
  [Progress: ✓───✓───✓]

        🎊 confetti particles 🎊

           ┌──────┐
           │  ✓   │  ← animated checkmark in green circle
           └──────┘
     Credential Claimed!
     Your credential has been
     securely added to your
     LearnCard wallet.

  ┌────────────────────────────────┐
  │      View My LearnCard         │
  └────────────────────────────────┘
```

**Checkmark animation:**
1. Circle scales in: `scale(0.6)` → `scale(1)` over 400ms with spring easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
2. After 300ms delay: SVG checkmark path draws in via `stroke-dashoffset` animation (500ms ease)
3. Circle: 72px, `background: linear-gradient(135deg, #ecfdf5, #d1fae5)`

**Confetti animation:**
- 24 CSS-only particles, absolutely positioned in a container overlay
- Colors: randomly chosen from LC palette (`#2EC4A5`, `#f59e0b`, `#8b5cf6`, `#ef4444`, `#3b82f6`, `#ec4899`, `#10b981`, `#06b6d4`, `#f43f5e`, `#fbbf24`, `#a78bfa`, `#34d399`)
- Shapes: squares (8×8), tall rects (6×10), wide rects (10×6), circles (7×7), small circles (5×5)
- Each particle: random left position (5-95%), random delay (0-0.4s), random duration (2.0-3.2s), random rotation (540-1080deg)
- Keyframes: start at top with `opacity: 1`, fall to `translateY(420px)` with `scale(0.2)` and `opacity: 0`
- Generated dynamically in JS on success view mount (vanilla `document.createElement` loop)
- Fires once per success view render

**Consent checkbox** (when `showConsent` is true): unchanged behavior, but styled consistently with the new design.

### 8. Skeleton Loading State (iframe)

Shown as the default initial render inside the iframe. The skeleton displays until the first `postMessage` from the parent delivers the config (credential name, branding, session state). Since the iframe uses `srcdoc`, DOM renders instantly but `window.__LC_EMBED__` is injected via a subsequent message. The skeleton bridges this gap (typically 50-200ms, but can be longer on slow connections). Once config arrives, the skeleton crossfades (200ms opacity) to the appropriate view.

```
  [Progress: ○───○───○]  ← dots inactive
  ┌─ Skeleton Card ────────────────┐
  │  ░░░░░░░░░░░░░ shimmer         │
  └────────────────────────────────┘
  ░░░░░░░░░░░          ← title skeleton
  ░░░░░░░░░░░░░░░░░░░  ← input skeleton
  ░░░░░░░░░░░░░░░░░░░  ← button skeleton
```

- Skeleton shapes match email view layout: card (76px), label (14px × 50%), input (44px), button (44px, 10px radius)
- Shimmer: `linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)` with `background-size: 200%`, animating `background-position` over 1.5s ease-in-out infinite
- Transitions to real content with a simple opacity crossfade (200ms)

### 9. View Transitions (iframe)

When switching between views (email → otp → success):

- Outgoing view: slides left 20px + fades to opacity 0 (200ms ease-out)
- Incoming view: starts 20px to the right + opacity 0, slides to position + fades in (200ms ease-in, 100ms delay)
- Total transition: ~300ms

Implementation: The `render()` function wraps the view swap in a CSS class toggle. The `.wrap` container gets `transition: transform 200ms, opacity 200ms`. On swap: add `.exiting` class (translateX(-20px), opacity 0), wait 200ms, swap DOM, add `.entering` class (translateX(20px), opacity 0), next frame remove `.entering` to trigger transition to rest state.

### 10. Button Loading State

When a button action is pending (send code, verify, accept):

- Button text crossfades (150ms) to: inline SVG spinner (14px, rotating) + contextual text
  - "Send Code →" becomes "Sending..."
  - "Verify" becomes "Verifying..."
  - "Accept Credential →" becomes "Claiming..."
- Spinner: simple rotating circle SVG, 1s linear infinite rotation
- Button becomes non-interactive: pointer-events none, opacity stays at 1.0 (no dimming — the spinner communicates state)

## Color System

### Default Palette (no branding override)

| Token | Value | Usage |
|-------|-------|-------|
| primaryColor | `#2EC4A5` | Buttons, active progress dots, input focus, OTP filled border |
| accentColor | `#239E85` | Button hover darkening. New default (was `#0F3BD9` for the old blue). If `branding.accentColor` is not set, auto-derive by darkening primaryColor ~20%. |
| Credential card start | `#e0faf3` | Light pastel teal |
| Credential card end | `#c4e8fb` | Light pastel blue |
| Card text | `#0c3a2e` | Dark teal |
| Success green | `#10b981` | Done dots, checkmark |
| Body text | `#111` | Titles |
| Secondary text | `#374151` | Labels, header brand |
| Tertiary text | `#6b7280` | Subtitles |
| Hint text | `#9ca3af` | Hints, placeholder |
| Border | `#e5e7eb` | Input borders, inactive dots |
| Light border | `#f0f0f0` | Header bottom, footer top |
| Error | `#dc2626` | Error messages |

### Custom primaryColor Adaptation

When `branding.primaryColor` is provided:
1. **Buttons:** Use primaryColor directly as background
2. **Button shadow:** 25% opacity of primaryColor
3. **Active progress dot:** primaryColor + 18% opacity glow ring
4. **Input focus ring:** primaryColor border + 10% opacity shadow
5. **OTP filled border:** primaryColor
6. **Credential card gradient:** Compute light tint (mix primaryColor with white at ~85% and ~70%) for start/end

Helper function to derive the tint:
```js
function lightenHex(hex, amount) {
  // Parse hex to RGB, lerp each channel toward 255, return hex
  const r = Math.round(parseInt(hex.slice(1,3), 16) + (255 - parseInt(hex.slice(1,3), 16)) * amount);
  const g = Math.round(parseInt(hex.slice(3,5), 16) + (255 - parseInt(hex.slice(3,5), 16)) * amount);
  const b = Math.round(parseInt(hex.slice(5,7), 16) + (255 - parseInt(hex.slice(5,7), 16)) * amount);
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}
```

## Testing

- **Visual:** Manual inspection of all 4 views + skeleton + transitions in the embed example app (`examples/embed-example/`)
- **Branding:** Test with custom primaryColor (e.g., `#e11d48` rose) to verify color adaptation
- **Logo:** Test with and without `branding.logoUrl` and `branding.partnerLogoUrl`
- **Existing tests:** Run `packages/learn-card-embed-sdk/src/index.test.ts` to verify no regressions
- **CSP:** Verify all animations work within the iframe's CSP (no external resources)
- **Size:** Check raw iframe HTML stays under 15KB; total built SDK output under 20KB gzipped

## Risks

| Risk | Mitigation |
|------|------------|
| Confetti JS increases iframe HTML size | 24 particles × ~100 chars each ≈ 2.4KB. Well within budget. |
| `@keyframes` not supported in very old browsers | ES2019 target already excludes IE. All target browsers support CSS animations. |
| Custom primaryColor produces unreadable card text | Card text uses dark tones on pastel backgrounds. Even bright primaryColors lighten to readable pastels. |
| View transition jank on low-end devices | 200ms is short enough. Only transitioning opacity + transform (GPU-composited). |
| Default primaryColor change (`#1F51FF` → `#2EC4A5`) | Visual breaking change for partners not setting `branding.primaryColor`. Acceptable: the embed SDK is pre-1.0 and in active development. Partners who care about color already set it explicitly. |
