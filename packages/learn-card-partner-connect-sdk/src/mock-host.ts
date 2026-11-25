/**
 * Standalone mock host for the Partner Connect SDK.
 *
 * When the SDK is not embedded in a real LearnCard host there is nothing to
 * answer its `postMessage` requests. `MockHost` locally simulates the host so
 * partner apps are fully buildable, demo-able, and testable in isolation. It
 * intercepts the SDK's single `sendMessage(action, payload)` chokepoint and
 * returns responses that match the shapes the real host produces.
 *
 * This module is browser-oriented but SSR-safe: it never touches `document` at
 * import time and degrades to log-only behavior when the DOM is unavailable.
 */

import {
    canonicalConsentScopeString,
    canonicalJsonString,
    compileInlineTemplate,
    encodeManifestForUrl,
    needsConsentSetup,
    normalizeConsentRequest,
    renderCompiledTemplate,
    validateInlineTemplate,
    validateTemplateData,
} from '@learncard/partner-connect-core';
import type {
    CapturedAppManifest,
    CapturedConsentRecord,
    CapturedTemplateRecord,
    ConsentRequest,
    InlineCredentialTemplate,
    MockHostOptions,
} from './types';
import { PartnerConnectError } from './types';

const DEFAULT_DID = 'did:web:mock.learncard.app:user';
const DEFAULT_NAMESPACE = 'lc-mock';
const DEFAULT_PUBLISH_ORIGIN = 'https://learncard.app';
const MOCK_PREFIX = '[LearnCard SDK · MOCK]';
const PUBLISH_DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * SDK-supplied context that is deliberately not part of the public
 * {@link MockHostOptions} surface.
 */
export interface MockHostContext {
    /**
     * Whether the publish origin was chosen deliberately (an explicit
     * `mockOptions.publishOrigin`, or an active override) rather than
     * inferred. Suppresses the "point me at a local LearnCard" HUD hint.
     */
    publishOriginPinned?: boolean;
}

interface ResolvedMockOptions {
    ui: boolean;
    log: boolean;
    persist: boolean;
    namespace: string;
    appId?: string;
    publishPrompt: boolean;
    publishOrigin: string;
}

interface StoredCounter {
    value: number;
    updatedAt: string;
}

type StoredManifestMap = Record<string, CapturedAppManifest>;

type StoredPublishDismissedAtMap = Record<string, string>;

type StoredHudCollapsedMap = Record<string, string>;

type MockStatus = 'pending' | 'claimed' | 'revoked';

interface MockCredential {
    credentialUri: string;
    boostUri?: string;
    templateAlias?: string;
    name: string;
    recipient: string;
    status: MockStatus;
    sentDate: string;
    claimedDate?: string;
    receivedDate?: string;
    credential: unknown;
}

interface InlineTemplateSessionState {
    canonicalTemplate: string;
    version: number;
}

interface TemplateQuery {
    templateAlias?: unknown;
    boostUri?: unknown;
}

type ToastTone = 'default' | 'positive' | 'publish' | 'warning';

/** A toast body is a list of plain strings and bold (`{ b }`) segments. */
type ToastSegment = string | { b: string };

/**
 * Line glyphs drawn on a 24×24 grid with `stroke="currentColor"`, so they
 * inherit color and render identically everywhere (unlike emoji).
 */
const ICON_PATHS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.6 14 7 22l5-3 5 3-1.6-8"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    open: '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    send: '<path d="M21 3 10 14"/><path d="M21 3 14.5 21l-4.5-7-7-4.5z"/>',
    sparkles:
        '<path d="M12 3.5 13.9 9l5.6 2-5.6 2L12 18.5 10.1 13l-5.6-2 5.6-2z"/><path d="M19 3v4M17 5h4"/>',
    sync: '<path d="M20 12a8 8 0 0 1-14.3 4.9M4 12a8 8 0 0 1 14.3-4.9"/><path d="M18.5 3v4h-4M5.5 21v-4h4"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6.5 2.5 8.5 2.5 8.5h-17S6 15.5 6 9"/><path d="M10.3 20.5a2 2 0 0 0 3.4 0"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c0-2.8-1.6-4.9-4-5.7"/>',
    publish: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    mark: '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M7 10h6M7 14h4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    close: '<path d="M17 7 7 17M7 7l10 10"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
} as const;

type IconName = keyof typeof ICON_PATHS;

interface ToastSpec {
    icon: IconName;
    segments: ToastSegment[];
    title?: string;
    tone?: ToastTone;
    ttl?: number;
    dismissible?: boolean;
    persistent?: boolean;
    action?: {
        label: string;
        href: string;
    };
}

interface ActiveToast {
    node: HTMLElement;
    timeoutId: ReturnType<typeof setTimeout> | null;
    count: number;
    countEl: HTMLElement;
    ttl: number;
    persistent: boolean;
}

interface HudFeature {
    icon: IconName;
    label: string;
    detail?: string;
    needsSetup?: boolean;
}

const MAX_VISIBLE_TOASTS = 3;

const PERMISSION_FEATURES: Record<string, { icon: IconName; label: string }> = {
    request_identity: { icon: 'user', label: 'Sign in with LearnCard' },
    send_credential: { icon: 'award', label: 'Award credentials' },
    template_issuance: { icon: 'send', label: 'Send from your templates' },
    request_consent: { icon: 'shield', label: 'Ask for permission' },
    credential_search: { icon: 'search', label: 'Ask learners to share credentials' },
    credential_by_id: { icon: 'search', label: 'Request a specific credential' },
    launch_feature: { icon: 'open', label: 'Open LearnCard screens' },
};

/**
 * Practice-mode chrome is injected into arbitrary partner pages, so every rule
 * is scoped under `.lc-mock-stack` / `.lc-mock-hud` and resets the properties
 * host CSS most often overrides (button/link/list defaults, box-sizing).
 */
const MOCK_STYLES = `
@keyframes lc-mock-in { from { opacity: 0; transform: translateY(14px) scale(0.96); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes lc-mock-in-top { from { opacity: 0; transform: translateY(-14px) scale(0.96); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes lc-mock-out { to { opacity: 0; transform: scale(0.94); filter: blur(4px); } }
@keyframes lc-mock-pop { from { opacity: 0; transform: translateY(10px) scale(0.94); } to { opacity: 1; transform: none; } }
@keyframes lc-mock-bump { 40% { transform: scale(1.18); } }
@keyframes lc-mock-pulse { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); } 70%, 100% { box-shadow: 0 0 0 6px rgba(16,185,129,0); } }

.lc-mock-stack, .lc-mock-hud {
  --lc-glass: rgba(255,255,255,0.72);
  --lc-glass-solid: rgba(251,251,252,0.97);
  --lc-group: rgba(255,255,255,0.66);
  --lc-edge: rgba(255,255,255,0.7);
  --lc-hairline: rgba(24,34,78,0.08);
  --lc-fill: rgba(24,34,78,0.06);
  --lc-fill-hover: rgba(24,34,78,0.1);
  --lc-ink: #18224E;
  --lc-ink-2: #52597A;
  --lc-ink-3: #8B91A7;
  --lc-solid: #18224E;
  --lc-on-solid: #FFFFFF;
  --lc-shadow: 0 0 0 0.5px rgba(24,34,78,0.1), 0 2px 8px rgba(24,34,78,0.06), 0 24px 56px -16px rgba(24,34,78,0.32);
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 13px; line-height: 1.4; letter-spacing: -0.006em; text-align: left;
  color: var(--lc-ink); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  position: fixed; z-index: 2147483647;
}
@media (prefers-color-scheme: dark) {
  .lc-mock-stack, .lc-mock-hud {
    --lc-glass: rgba(30,37,68,0.62);
    --lc-glass-solid: rgba(30,37,68,0.97);
    --lc-group: rgba(255,255,255,0.06);
    --lc-edge: rgba(255,255,255,0.14);
    --lc-hairline: rgba(255,255,255,0.08);
    --lc-fill: rgba(255,255,255,0.1);
    --lc-fill-hover: rgba(255,255,255,0.16);
    --lc-ink: #FBFBFC;
    --lc-ink-2: #C5C8D3;
    --lc-ink-3: #A8ACBD;
    --lc-solid: #FBFBFC;
    --lc-on-solid: #18224E;
    --lc-shadow: 0 0 0 0.5px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), 0 24px 56px -16px rgba(0,0,0,0.6);
  }
}
.lc-mock-stack *, .lc-mock-hud * { box-sizing: border-box; }
.lc-mock-stack svg, .lc-mock-hud svg { display: block; flex: none; }
.lc-mock-stack button, .lc-mock-hud button {
  font: inherit; color: inherit; margin: 0; text-transform: none; letter-spacing: inherit;
  -webkit-appearance: none; appearance: none; -webkit-tap-highlight-color: transparent;
}
.lc-mock-stack a, .lc-mock-hud a { -webkit-tap-highlight-color: transparent; }
.lc-mock-stack :focus-visible, .lc-mock-hud :focus-visible { outline: 2px solid #10B981; outline-offset: 2px; }

.lc-mock-glass {
  background: var(--lc-glass);
  -webkit-backdrop-filter: saturate(180%) blur(28px); backdrop-filter: saturate(180%) blur(28px);
  border: 0.5px solid var(--lc-edge);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), var(--lc-shadow);
}
@supports not ((-webkit-backdrop-filter: blur(1px)) or (backdrop-filter: blur(1px))) {
  .lc-mock-glass { background: var(--lc-glass-solid); }
}

.lc-mock-dot {
  width: 7px; height: 7px; border-radius: 999px; background: #10B981; flex: none;
  animation: lc-mock-pulse 2.4s ease-out infinite;
}

/* Notices */
.lc-mock-stack {
  bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px));
  right: max(20px, calc(env(safe-area-inset-right, 0px) + 12px));
  width: min(360px, calc(100vw - 40px));
  display: flex; flex-direction: column; gap: 10px; pointer-events: none;
}
.lc-mock-toast {
  position: relative; pointer-events: auto; display: flex; align-items: flex-start; gap: 12px;
  width: 100%; padding: 12px 14px 13px 12px; border-radius: 22px;
  animation: lc-mock-in 460ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.lc-mock-toast:hover { transform: translateY(-2px); }
.lc-mock-toast.lc-mock-out { animation: lc-mock-out 200ms cubic-bezier(0.4, 0, 1, 1) forwards; pointer-events: none; }
.lc-mock-toast--hidden { display: none; }
.lc-mock-toast--publish { order: -1; padding: 14px 14px 14px 12px; }
.lc-mock-toast--dismissible .lc-mock-content { padding-right: 22px; }

.lc-mock-tile {
  width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: none;
  color: #FFFFFF; background: linear-gradient(180deg, #353E64 0%, #18224E 100%);
  box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.18), 0 1px 2px rgba(24,34,78,0.24);
}
.lc-mock-tile svg { width: 18px; height: 18px; }
.lc-mock-toast--positive .lc-mock-tile { background: linear-gradient(180deg, #34D399 0%, #059669 100%); }
.lc-mock-toast--warning .lc-mock-tile { background: linear-gradient(180deg, #FBBF24 0%, #D97706 100%); }
.lc-mock-hud-row-detail.is-setup { color: #B45309; font-weight: 500; }
.lc-mock-hud-setup-dot { width: 8px; height: 8px; margin: 0 4px; border-radius: 999px; background: #F59E0B; flex: none; }

.lc-mock-content { flex: 1; min-width: 0; }
.lc-mock-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; font-size: 11.5px; font-weight: 600; color: var(--lc-ink-3); }
.lc-mock-chip { padding: 1px 7px; border-radius: 999px; background: var(--lc-fill); color: var(--lc-ink-2); font-size: 10.5px; font-weight: 600; }
.lc-mock-count {
  margin-left: auto; min-width: 22px; padding: 1px 7px; border-radius: 999px; text-align: center;
  background: var(--lc-solid); color: var(--lc-on-solid); font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.lc-mock-bump { animation: lc-mock-bump 260ms ease-out; }
.lc-mock-title { font-size: 14.5px; font-weight: 600; letter-spacing: -0.012em; margin: 1px 0 2px; }
.lc-mock-body { font-size: 13.5px; line-height: 1.42; color: var(--lc-ink); overflow-wrap: anywhere; white-space: pre-line; }
.lc-mock-body strong { font-weight: 600; }
.lc-mock-toast--publish .lc-mock-body { color: var(--lc-ink-2); }

.lc-mock-action {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 11px; padding: 9px 15px; border-radius: 999px;
  background: var(--lc-solid); color: var(--lc-on-solid) !important; text-decoration: none !important;
  font-size: 13px; font-weight: 600; line-height: 1;
  transition: transform 160ms ease, opacity 160ms ease;
}
.lc-mock-action svg { width: 14px; height: 14px; }
.lc-mock-action:hover { opacity: 0.9; }
.lc-mock-action:active { transform: scale(0.97); }

.lc-mock-close {
  position: absolute; top: 10px; right: 10px; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 999px;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  background: var(--lc-fill); color: var(--lc-ink-2); transition: background 160ms ease, color 160ms ease;
}
.lc-mock-close svg { width: 13px; height: 13px; }
.lc-mock-close:hover { background: var(--lc-fill-hover); color: var(--lc-ink); }

/* Practice panel */
.lc-mock-hud {
  left: max(20px, calc(env(safe-area-inset-left, 0px) + 12px));
  bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px));
}
.lc-mock-hud.lc-mock-animate > * { animation: lc-mock-pop 380ms cubic-bezier(0.22, 1, 0.36, 1) backwards; transform-origin: bottom left; }

.lc-mock-hud-pill {
  display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 6px; border-radius: 999px;
  cursor: pointer; font-size: 13px; font-weight: 600; color: var(--lc-ink);
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.lc-mock-hud-pill:hover { transform: translateY(-2px); }
.lc-mock-hud-pill:active { transform: scale(0.97); }
.lc-mock-hud-pill .lc-mock-dot { margin-left: 2px; }
.lc-mock-hud-mark {
  width: 28px; height: 28px; border-radius: 999px; display: flex; align-items: center; justify-content: center; flex: none;
  color: #FFFFFF; background: linear-gradient(180deg, #353E64 0%, #18224E 100%);
  box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.18);
}
.lc-mock-hud-mark svg { width: 15px; height: 15px; }
.lc-mock-hud-mark--lg { width: 36px; height: 36px; border-radius: 11px; }
.lc-mock-hud-mark--lg svg { width: 19px; height: 19px; }
.lc-mock-hud-badge {
  min-width: 24px; height: 24px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
  background: var(--lc-fill); color: var(--lc-ink-2); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums;
}

.lc-mock-hud-card {
  width: min(328px, calc(100vw - 40px)); max-height: calc(100vh - 40px); overflow: auto;
  border-radius: 26px; padding: 8px 8px 10px; overscroll-behavior: contain;
}
.lc-mock-hud-header { display: flex; align-items: center; gap: 11px; padding: 6px 4px 12px 6px; }
.lc-mock-hud-heading { flex: 1; min-width: 0; }
.lc-mock-hud-title { display: flex; align-items: center; gap: 7px; font-size: 15px; font-weight: 600; letter-spacing: -0.014em; }
.lc-mock-hud-subtitle { font-size: 12px; color: var(--lc-ink-3); margin-top: 1px; }
.lc-mock-hud-minimize {
  width: 30px; height: 30px; padding: 0; border: 0; border-radius: 999px; flex: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--lc-fill); color: var(--lc-ink-2); transition: background 160ms ease, color 160ms ease;
}
.lc-mock-hud-minimize svg { width: 16px; height: 16px; }
.lc-mock-hud-minimize:hover { background: var(--lc-fill-hover); color: var(--lc-ink); }

.lc-mock-hud-group { background: var(--lc-group); border: 0.5px solid var(--lc-hairline); border-radius: 18px; }
.lc-mock-hud-app { display: flex; align-items: center; gap: 11px; padding: 10px 12px; }
.lc-mock-hud-avatar {
  width: 36px; height: 36px; border-radius: 10px; flex: none; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--lc-fill); color: var(--lc-ink-2); font-size: 15px; font-weight: 600;
}
.lc-mock-hud-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.lc-mock-hud-app-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.lc-mock-hud-section {
  padding: 14px 12px 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--lc-ink-3);
}
.lc-mock-hud-list { list-style: none; margin: 0; padding: 0; max-height: min(40vh, 320px); overflow: auto; }
.lc-mock-hud-row { position: relative; display: flex; align-items: center; gap: 11px; padding: 9px 12px; margin: 0; }
.lc-mock-hud-row + .lc-mock-hud-row::before {
  content: ''; position: absolute; top: 0; left: 50px; right: 0; height: 0.5px; background: var(--lc-hairline);
}
.lc-mock-hud-glyph {
  width: 28px; height: 28px; border-radius: 8px; flex: none; display: flex; align-items: center; justify-content: center;
  background: var(--lc-fill); color: var(--lc-ink);
}
.lc-mock-hud-glyph svg { width: 15px; height: 15px; }
.lc-mock-hud-row-text { flex: 1; min-width: 0; }
.lc-mock-hud-row-label { font-size: 13px; font-weight: 500; }
.lc-mock-hud-row-detail { font-size: 12px; color: var(--lc-ink-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.lc-mock-hud-check { color: #10B981; flex: none; }
.lc-mock-hud-check svg { width: 16px; height: 16px; stroke-width: 2.4; }
.lc-mock-hud-empty { padding: 14px; font-size: 13px; color: var(--lc-ink-3); line-height: 1.45; }

.lc-mock-hud-footer { display: flex; gap: 8px; padding: 12px 2px 0; }
.lc-mock-hud-publish {
  flex: 1; height: 42px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  background: var(--lc-solid); color: var(--lc-on-solid) !important; text-decoration: none !important;
  font-size: 14px; font-weight: 600; transition: transform 160ms ease, opacity 160ms ease;
}
.lc-mock-hud-publish svg { width: 15px; height: 15px; }
.lc-mock-hud-publish:hover { opacity: 0.9; }
.lc-mock-hud-publish:active { transform: scale(0.98); }
.lc-mock-hud-copy {
  width: 42px; height: 42px; padding: 0; border: 0; border-radius: 999px; flex: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: var(--lc-fill); color: var(--lc-ink); transition: background 160ms ease, color 160ms ease, transform 160ms ease;
}
.lc-mock-hud-copy svg { width: 17px; height: 17px; }
.lc-mock-hud-copy:hover { background: var(--lc-fill-hover); }
.lc-mock-hud-copy:active { transform: scale(0.94); }
.lc-mock-hud-copy.is-copied { background: rgba(16,185,129,0.14); color: #059669; }
.lc-mock-hud .lc-mock-hud-reset { display: block; margin: 10px auto 0; border: 0; background: transparent; color: var(--lc-ink-3); font-size: 12px; cursor: pointer; }
.lc-mock-hud .lc-mock-hud-reset:hover { color: var(--lc-ink); }
.lc-mock-hud .lc-mock-hud-confirm { padding: 12px 8px; color: var(--lc-ink); }
.lc-mock-hud .lc-mock-hud-confirm p { color: var(--lc-ink-3); font-size: 13px; line-height: 1.5; }
.lc-mock-hud .lc-mock-hud-confirm-actions { display: flex; gap: 8px; margin-top: 16px; }
.lc-mock-hud .lc-mock-hud-confirm button { border-radius: 999px; padding: 10px 16px; border: 1px solid var(--lc-ink-3); background: transparent; color: var(--lc-ink); cursor: pointer; }
.lc-mock-hud .lc-mock-hud-confirm .lc-mock-hud-reset-confirm { background: #DC2626; color: white; border-color: #DC2626; }
.lc-mock-hud-publish-hint { padding: 10px 8px 0; font-size: 11.5px; line-height: 1.45; color: var(--lc-ink-3); overflow-wrap: anywhere; }
.lc-mock-hud-publish-hint code {
  display: inline-block; max-width: 100%; margin-top: 3px; word-break: break-all;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 11px; padding: 1px 5px; border-radius: 6px;
  background: var(--lc-fill); color: var(--lc-ink-2);
}

@media (max-width: 640px) {
  .lc-mock-stack {
    top: max(12px, calc(env(safe-area-inset-top, 0px) + 8px)); bottom: auto; left: 12px; right: 12px; width: auto;
    flex-direction: column-reverse;
  }
  .lc-mock-toast { animation-name: lc-mock-in-top; }
  .lc-mock-toast--older { display: none; }
  .lc-mock-hud { left: 12px; bottom: max(12px, calc(env(safe-area-inset-bottom, 0px) + 8px)); }
  .lc-mock-hud-card { width: calc(100vw - 24px); }
}
@media (prefers-reduced-motion: reduce) {
  .lc-mock-stack *, .lc-mock-hud *, .lc-mock-hud.lc-mock-animate > * { animation: none !important; transition: none !important; }
}
`.trim();

const hasDocument = (): boolean =>
    typeof document !== 'undefined' && typeof document.createElement === 'function';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Builds an inline SVG glyph. Paths are static constants, never user input. */
const createIcon = (name: IconName): SVGSVGElement => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.9');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICON_PATHS[name];
    return svg;
};

const createEl = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    className?: string,
    text?: string
): HTMLElementTagNameMap[K] => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
};

const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? '' : 's'}`;

const readablePath = (path: string): string => path.split(/[?#]/)[0] || path;

const readHost = (url: string | undefined): string => {
    if (!url) return '';
    try {
        return new URL(url).host;
    } catch {
        return '';
    }
};

const readableTemplateName = (record: CapturedTemplateRecord): string => {
    const template = record.template as { name?: unknown } | undefined;
    const name = template?.name;
    return typeof name === 'string' && name.trim() && !name.includes('{{')
        ? name.trim()
        : record.alias;
};

const MAX_APP_FINGERPRINT_LENGTH = 64;

const slugifyAppFingerprint = (value: string | undefined): string => {
    if (!value) return 'default';

    const slug = value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, MAX_APP_FINGERPRINT_LENGTH)
        .replace(/-$/g, '');

    return slug || 'default';
};

const readAchievementName = (payload: unknown): string => {
    if (!payload || typeof payload !== 'object') return 'a credential';

    const record = payload as Record<string, unknown>;

    // Template-based issuance (APP_EVENT / send-credential).
    if (typeof record.templateAlias === 'string' && record.templateAlias) {
        const data = record.templateData;
        if (data && typeof data === 'object') {
            const fields = data as Record<string, unknown>;
            const named =
                fields.name ?? fields.achievementName ?? fields.courseName ?? fields.title;
            if (typeof named === 'string' && named) return named;
        }
        return record.templateAlias;
    }

    // Raw verifiable credential.
    const credential = (record.credential ?? record) as Record<string, unknown>;
    if (credential && typeof credential === 'object') {
        const subject = credential.credentialSubject as Record<string, unknown> | undefined;
        const achievement = subject?.achievement as Record<string, unknown> | undefined;
        if (achievement && typeof achievement.name === 'string' && achievement.name) {
            return achievement.name;
        }
        if (typeof credential.name === 'string' && credential.name) return credential.name;
    }

    return 'a credential';
};

const readRenderedCredentialName = (credential: Record<string, unknown>): string => {
    if (typeof credential.name === 'string' && credential.name) return credential.name;

    const subject = credential.credentialSubject;
    if (subject && typeof subject === 'object' && !Array.isArray(subject)) {
        const achievement = (subject as Record<string, unknown>).achievement;
        if (achievement && typeof achievement === 'object' && !Array.isArray(achievement)) {
            const name = (achievement as Record<string, unknown>).name;
            if (typeof name === 'string' && name) return name;
        }
    }

    return 'a credential';
};

const buildConsentScopeToastSegments = (payload: unknown): ToastSegment[] => {
    const scopes = (payload as { scopes?: unknown } | undefined)?.scopes;

    if (!scopes || typeof scopes !== 'object' || Array.isArray(scopes)) {
        return [
            'In LearnCard, the learner would review this request. Approved automatically here.',
        ];
    }

    const normalized = normalizeConsentRequest(scopes as ConsentRequest);
    const readCategories = normalized.read.credentialCategories;
    const personalFields = normalized.read.personalFields;
    const writeCategories = normalized.write.credentialCategories;
    const asks: ToastSegment[][] = [];

    if (readCategories.length > 0) {
        asks.push(['see their ', { b: readCategories.join(', ') }, ' credentials']);
    }

    if (personalFields.length > 0) {
        asks.push(['see their ', { b: personalFields.join(', ') }]);
    }

    if (writeCategories.length > 0) {
        asks.push(['add ', { b: writeCategories.join(', ') }, ' credentials']);
    }

    if (asks.length === 0) {
        return ['The learner would be asked for permission. Approved automatically here.'];
    }

    const parts: ToastSegment[] = ['The learner would be asked to let your app '];
    asks.forEach((ask, index) => {
        if (index > 0) parts.push(index === asks.length - 1 ? ' and ' : ', ');
        parts.push(...ask);
    });
    parts.push('. Approved automatically here.');

    return parts;
};

/**
 * Simulates the LearnCard host for a single {@link PartnerConnect} instance.
 * All public methods route through `handle`, keeping the mock behind the same
 * `(action, payload)` contract the real host answers over `postMessage`.
 */
export class MockHost {
    private readonly options: ResolvedMockOptions;

    private readonly context: MockHostContext;

    /** In-memory counter fallback used when persistence is off/unavailable. */
    private readonly memoryCounters = new Map<string, StoredCounter>();

    private readonly memoryManifests: StoredManifestMap = {};

    private readonly memoryPublishDismissedAt: StoredPublishDismissedAtMap = {};

    private readonly memoryHudCollapsed: StoredHudCollapsedMap = {};

    private initialDocumentTitle: string | null | undefined;
    private appFingerprint: string | undefined;
    private memoryAppKey: string | undefined;
    private iconSource: string | undefined;
    private iconGeneration = 0;
    private readonly iconCleanups = new Set<() => void>();
    private confirmingReset = false;

    /** Session-scoped credential store; reads reflect writes and seeds. */
    private readonly credentials: MockCredential[] = [];

    /** Session-scoped alias → inline template version state. */
    private readonly inlineTemplateVersions = new Map<string, InlineTemplateSessionState>();

    private readonly identity: { did: string; [key: string]: unknown };

    /** DOM nodes injected for visual feedback, tracked for cleanup. */
    private readonly domNodes = new Set<HTMLElement>();

    /** The app's single AI Topic, created lazily by the first AI session. */
    private aiTopic: { topicUri: string; topicCredentialUri: string } | null = null;

    private styleEl: HTMLStyleElement | null = null;
    private stackEl: HTMLElement | null = null;
    private hudEl: HTMLElement | null = null;
    private hudAnimateNext = true;
    private readonly activeToasts = new Map<string, ActiveToast>();
    /** Pending exit-animation timers, tracked so `destroy()` can cancel them. */
    private readonly exitTimers = new Set<ReturnType<typeof setTimeout>>();
    private idSeq = 0;
    private destroyed = false;
    private publishPromptShown = false;

    constructor(options?: MockHostOptions, context?: MockHostContext) {
        this.context = { ...context };
        this.options = {
            ui: options?.ui ?? true,
            log: options?.log ?? true,
            persist: options?.persist ?? true,
            namespace: options?.namespace || DEFAULT_NAMESPACE,
            appId: options?.appId,
            publishPrompt: options?.publishPrompt ?? true,
            publishOrigin: options?.publishOrigin || DEFAULT_PUBLISH_ORIGIN,
        };

        this.identity = {
            ...(options?.identity ?? {}),
            did: options?.identity?.did || options?.did || DEFAULT_DID,
        };

        for (const seed of options?.credentials ?? []) {
            this.addCredential({
                name: seed.name || seed.templateAlias || 'Mock Credential',
                templateAlias: seed.templateAlias,
                boostUri: seed.boostUri,
                recipient: seed.recipient,
                status: seed.status,
            });
        }

        for (const [key, value] of Object.entries(options?.counters ?? {})) {
            if (this.readCounter(key) === undefined) this.writeCounter(key, value);
        }

        this.announce();
    }

    /**
     * Resolve a simulated response for one SDK request. Mirrors the real host:
     * direct actions map 1:1, and `APP_EVENT` is dispatched by its `type`.
     */
    public handle(action: string, payload?: unknown): Promise<unknown> {
        if (this.destroyed) {
            return Promise.reject(
                new PartnerConnectError(
                    'SDK_DESTROYED',
                    'Mock host was destroyed before the request completed'
                )
            );
        }

        this.log(action, payload);

        if (action === 'APP_EVENT') {
            return this.handleAppEvent(payload as Record<string, unknown>);
        }

        const response = (() => {
            switch (action) {
                case 'REQUEST_IDENTITY':
                    this.toast({
                        icon: 'user',
                        segments: [
                            'In LearnCard, the learner would sign in. Using a practice profile for now.',
                        ],
                    });
                    return Promise.resolve({
                        token: `mock-token-${Date.now()}`,
                        user: { ...this.identity },
                    });

                case 'SEND_CREDENTIAL': {
                    const name = readAchievementName(payload);
                    const credentialId = `mock-credential-${Date.now()}-${(this.idSeq += 1)}`;
                    this.addCredential({
                        name,
                        credentialUri: credentialId,
                        credential: (payload as { credential?: unknown } | undefined)?.credential,
                    });
                    this.showClaimToast(name);
                    return Promise.resolve({ credentialId, stored: true });
                }

                case 'REQUEST_CONSENT': {
                    const redirect = Boolean(
                        (payload as { redirect?: boolean } | undefined)?.redirect
                    );

                    try {
                        const scopes = (payload as { scopes?: unknown } | undefined)?.scopes;

                        if (scopes !== undefined) {
                            normalizeConsentRequest(scopes as ConsentRequest);
                        }
                    } catch (error) {
                        return Promise.reject(
                            new PartnerConnectError(
                                'CONSENT_SCOPES_INVALID',
                                error instanceof Error ? error.message : 'Invalid consent scopes'
                            )
                        );
                    }

                    this.showConsentToast(payload, redirect);
                    return Promise.resolve({ granted: true });
                }

                case 'LAUNCH_FEATURE': {
                    const featurePath =
                        (payload as { featurePath?: string } | undefined)?.featurePath ?? '';
                    this.toast({
                        icon: 'open',
                        segments: featurePath
                            ? [
                                  'In LearnCard, this would open ',
                                  { b: readablePath(featurePath) },
                                  '.',
                              ]
                            : ['In LearnCard, this would open a feature screen.'],
                    });
                    return Promise.resolve({ launched: true, featurePath });
                }

                case 'ASK_CREDENTIAL_SEARCH': {
                    const held = this.selfCredentials();
                    this.toast({
                        icon: 'search',
                        segments: held.length
                            ? [
                                  'The learner could share ',
                                  { b: plural(held.length, 'credential') },
                                  '.',
                              ]
                            : [
                                  'In LearnCard, the learner would choose credentials to share. None yet in practice.',
                              ],
                    });
                    return Promise.resolve({
                        verifiablePresentation: {
                            verifiableCredential: held.map(c => c.credential),
                        },
                    });
                }

                case 'ASK_CREDENTIAL_SPECIFIC': {
                    const credentialId = (payload as { credentialId?: string } | undefined)
                        ?.credentialId;
                    const found = this.credentials.find(c => c.credentialUri === credentialId);
                    this.toast({
                        icon: 'search',
                        segments: found
                            ? ['The learner would share ', { b: found.name }, '.']
                            : [
                                  'In LearnCard, the learner would be asked to share this credential. It isn’t in practice data yet.',
                              ],
                    });
                    return Promise.resolve({ credential: found?.credential });
                }

                case 'INITIATE_TEMPLATE_ISSUE': {
                    const input = payload as
                        { templateId?: string; draftRecipients?: string[] } | undefined;
                    const templateId = input?.templateId ?? '';
                    const recipients = Array.isArray(input?.draftRecipients)
                        ? (input?.draftRecipients as string[])
                        : [];
                    for (const recipient of recipients) {
                        this.addCredential({
                            name: templateId || 'Boost',
                            boostUri: templateId,
                            recipient,
                            status: 'pending',
                        });
                    }
                    this.toast({
                        icon: 'send',
                        segments: recipients.length
                            ? [
                                  'In LearnCard, this would send to ',
                                  { b: plural(recipients.length, 'person') },
                                  '.',
                              ]
                            : ['In LearnCard, this would open the send screen.'],
                    });
                    return Promise.resolve({ issued: true });
                }

                case 'REQUEST_LEARNER_CONTEXT': {
                    const opts = (payload ?? {}) as {
                        includeCredentials?: boolean;
                        format?: string;
                    };
                    const includeCredentials = opts.includeCredentials !== false;
                    const structured = opts.format === 'structured';
                    const held = includeCredentials ? this.selfCredentials() : [];
                    this.toast({
                        icon: 'sparkles',
                        segments: !includeCredentials
                            ? [
                                  'In LearnCard, the learner’s profile would load, without credentials.',
                              ]
                            : held.length
                              ? [
                                    'Learner profile loaded with ',
                                    { b: plural(held.length, 'credential') },
                                    '.',
                                ]
                              : [
                                    'In LearnCard, the learner’s profile would load here. Empty in practice.',
                                ],
                    });
                    const prompt = !includeCredentials
                        ? 'Mock learner context: credentials were not requested.'
                        : held.length
                          ? `Mock learner context. Credentials held: ${held
                                .map(c => c.name)
                                .join(', ')}.`
                          : 'Mock learner context: this user has no credentials in standalone mode.';
                    return Promise.resolve({
                        status: 'ready',
                        prompt,
                        did: this.identity.did,
                        // Matches the real host: `raw` only ships for format: 'structured'.
                        ...(structured
                            ? { raw: { credentials: held.map(c => c.credential) } }
                            : {}),
                    });
                }

                case 'GET_SYNC_STATUS':
                    this.toast({
                        icon: 'sync',
                        segments: [
                            'In LearnCard, this checks that the learner’s data is up to date. Ready in practice.',
                        ],
                    });
                    return Promise.resolve({
                        status: 'ready',
                        progress: {
                            totalCredentials: 0,
                            completedCredentials: 0,
                            failedCredentials: 0,
                            retryCount: 0,
                        },
                    });

                default:
                    this.toast({
                        icon: 'sparkles',
                        segments: ['In LearnCard, this would run ', { b: action }, '.'],
                    });
                    return Promise.resolve({});
            }
        })();

        return response.then(result => {
            this.captureHandledAction(action, payload);
            return result;
        });
    }

    /** Tear down injected UI and clear in-memory state. */
    public destroy(): void {
        this.destroyed = true;
        this.cancelIconCapture();

        for (const entry of this.activeToasts.values()) {
            if (entry.timeoutId) clearTimeout(entry.timeoutId);
        }
        this.activeToasts.clear();

        for (const timer of this.exitTimers) clearTimeout(timer);
        this.exitTimers.clear();

        for (const node of this.domNodes) node.remove();
        this.domNodes.clear();

        if (this.stackEl) {
            this.stackEl.remove();
            this.stackEl = null;
        }

        if (this.styleEl) {
            this.styleEl.remove();
            this.styleEl = null;
        }

        this.memoryCounters.clear();
        for (const key of Object.keys(this.memoryManifests)) delete this.memoryManifests[key];
        for (const key of Object.keys(this.memoryPublishDismissedAt)) {
            delete this.memoryPublishDismissedAt[key];
        }
        for (const key of Object.keys(this.memoryHudCollapsed)) delete this.memoryHudCollapsed[key];
        this.credentials.length = 0;
    }

    public getCapturedManifest(): CapturedAppManifest | undefined {
        const manifest = this.loadManifest();
        return manifest ? this.cloneManifest(manifest) : undefined;
    }

    public getPublishOrigin(): string {
        return this.options.publishOrigin;
    }

    public resetPracticeMode(): void {
        if (this.destroyed) return;
        this.cancelIconCapture();
        const manifests = this.loadManifestMap();
        delete manifests[this.getAppFingerprint()];
        this.replaceMemoryManifestMap(manifests);
        if (this.options.persist) {
            try {
                localStorage.setItem(this.manifestStorageKey(), JSON.stringify(manifests));
                for (const key of [
                    this.counterStorageKey(),
                    this.publishDismissedStorageKey(),
                    this.appKeyStorageKey(),
                ]) {
                    localStorage.removeItem(key);
                }
            } catch {
                /* Storage may be unavailable. */
            }
        }
        this.memoryCounters.clear();
        this.memoryAppKey = undefined;
        delete this.memoryPublishDismissedAt[this.getAppFingerprint()];
        this.credentials.length = 0;
        this.inlineTemplateVersions.clear();
        this.aiTopic = null;
        this.publishPromptShown = false;
        this.confirmingReset = false;
        for (const [key, entry] of this.activeToasts) {
            if (entry.node.classList.contains('lc-mock-toast--publish')) this.dismissToast(key);
        }
        this.saveHudCollapsed(true);
        this.updateManifestHud();
        this.toast({ icon: 'sync', segments: ['Started fresh.'] });
    }

    private handleAppEvent(event: Record<string, unknown>): Promise<unknown> {
        const type = typeof event?.type === 'string' ? event.type : '';

        const response = (() => {
            switch (type) {
                case 'send-credential': {
                    if (
                        typeof event.alias === 'string' &&
                        event.alias &&
                        event.template &&
                        typeof event.template === 'object'
                    ) {
                        const alias = event.alias;
                        const template = event.template as InlineCredentialTemplate;
                        const templateErrors = validateInlineTemplate(template);

                        if (templateErrors.length > 0) {
                            return Promise.reject(
                                new PartnerConnectError(
                                    'TEMPLATE_INVALID',
                                    templateErrors
                                        .map(error => `${error.path}: ${error.message}`)
                                        .join('\n')
                                )
                            );
                        }

                        const compiled = compileInlineTemplate(template);
                        const templateData =
                            typeof event.templateData === 'object' && event.templateData !== null
                                ? (event.templateData as Record<string, unknown>)
                                : undefined;
                        const dataErrors = validateTemplateData(
                            compiled.variableManifest,
                            templateData
                        );

                        if (dataErrors.length > 0) {
                            return Promise.reject(
                                new PartnerConnectError(
                                    'TEMPLATE_DATA_INVALID',
                                    dataErrors
                                        .map(error => `${error.path}: ${error.message}`)
                                        .join('\n')
                                )
                            );
                        }

                        const canonicalTemplate = canonicalJsonString(template);
                        const previousState = this.inlineTemplateVersions.get(alias);
                        const templateVersion = previousState
                            ? previousState.canonicalTemplate === canonicalTemplate
                                ? previousState.version
                                : previousState.version + 1
                            : 1;

                        this.inlineTemplateVersions.set(alias, {
                            canonicalTemplate,
                            version: templateVersion,
                        });

                        const boostUri = `lc:mock:inline-boost:${alias}`;

                        if (event.preventDuplicateClaim) {
                            const existing = this.selfCredentials().find(c =>
                                this.matchesTemplate(c, { templateAlias: alias, boostUri })
                            );
                            if (existing) {
                                this.toast({
                                    icon: 'award',
                                    segments: [
                                        'The learner already has ',
                                        { b: existing.name },
                                        '.',
                                    ],
                                });
                                return Promise.resolve({
                                    credentialUri: existing.credentialUri,
                                    boostUri: existing.boostUri ?? boostUri,
                                    alreadyClaimed: true,
                                    hasCredential: true,
                                    status: existing.status,
                                    receivedDate: existing.receivedDate,
                                    templateVersion,
                                });
                            }
                        }

                        const renderedCredential = renderCompiledTemplate(
                            compiled.credentialTemplateJson,
                            {
                                ...(templateData ?? {}),
                                issue_date: new Date().toISOString(),
                                issuer_did: 'did:web:mock.learncard.app:app',
                                recipient_did: this.identity.did,
                            }
                        );
                        renderedCredential._mock = true;

                        const renderedName = readRenderedCredentialName(renderedCredential);
                        const record = this.addCredential({
                            name: renderedName,
                            templateAlias: alias,
                            boostUri,
                            status: 'claimed',
                            credential: renderedCredential,
                        });

                        this.showClaimToast(renderedName, templateVersion);

                        return Promise.resolve({
                            credentialUri: record.credentialUri,
                            boostUri: record.boostUri ?? boostUri,
                            alreadyClaimed: false,
                            hasCredential: true,
                            status: 'claimed',
                            receivedDate: record.receivedDate,
                            templateVersion,
                        });
                    }

                    const name = readAchievementName(event);
                    const templateAlias =
                        typeof event.templateAlias === 'string' ? event.templateAlias : undefined;
                    const boostUri = `lc:mock:boost:${String(event.templateAlias ?? 'template')}`;

                    if (event.preventDuplicateClaim) {
                        const existing = this.selfCredentials().find(c =>
                            this.matchesTemplate(c, { templateAlias, boostUri })
                        );
                        if (existing) {
                            this.toast({
                                icon: 'award',
                                segments: ['The learner already has ', { b: existing.name }, '.'],
                            });
                            return Promise.resolve({
                                credentialUri: existing.credentialUri,
                                boostUri: existing.boostUri ?? boostUri,
                                alreadyClaimed: true,
                                hasCredential: true,
                                status: existing.status,
                                receivedDate: existing.receivedDate,
                            });
                        }
                    }

                    const record = this.addCredential({
                        name,
                        templateAlias,
                        boostUri,
                        status: 'claimed',
                    });
                    this.showClaimToast(name);
                    return Promise.resolve({
                        credentialUri: record.credentialUri,
                        boostUri: record.boostUri ?? boostUri,
                        alreadyClaimed: false,
                        hasCredential: true,
                        status: 'claimed',
                        receivedDate: record.receivedDate,
                    });
                }

                case 'check-credential': {
                    const held = this.selfCredentials().find(c => this.matchesTemplate(c, event));
                    this.toast({
                        icon: 'search',
                        segments: held
                            ? ['The learner already has ', { b: held.name }, '.']
                            : ['The learner doesn’t have this credential yet.'],
                    });
                    return Promise.resolve(
                        held
                            ? {
                                  hasCredential: true,
                                  credentialUri: held.credentialUri,
                                  receivedDate: held.receivedDate,
                                  status: held.status,
                              }
                            : { hasCredential: false }
                    );
                }

                case 'check-issuance-status': {
                    const recipient = typeof event.recipient === 'string' ? event.recipient : '';
                    const match = this.credentials.find(
                        c => this.matchesTemplate(c, event) && c.recipient === recipient
                    );
                    this.toast({
                        icon: 'send',
                        segments: match
                            ? ['Sent to ', { b: recipient }, ' — ', { b: match.status }, '.']
                            : ['Not sent to this person yet.'],
                    });
                    return Promise.resolve(
                        match
                            ? {
                                  sent: true,
                                  credentialUri: match.credentialUri,
                                  sentDate: match.sentDate,
                                  claimedDate: match.claimedDate,
                                  status: match.status,
                              }
                            : { sent: false }
                    );
                }

                case 'get-template-recipients': {
                    const matched = this.credentials.filter(c => this.matchesTemplate(c, event));
                    const limit =
                        typeof event.limit === 'number' && event.limit > 0
                            ? event.limit
                            : undefined;
                    // Cursor pagination: the cursor is the offset of the next record,
                    // issued by the previous page so callers can walk the full list.
                    const parsedCursor =
                        typeof event.cursor === 'string' ? Number.parseInt(event.cursor, 10) : 0;
                    const offset =
                        Number.isFinite(parsedCursor) && parsedCursor > 0 ? parsedCursor : 0;
                    const page = limit
                        ? matched.slice(offset, offset + limit)
                        : matched.slice(offset);
                    const nextOffset = offset + page.length;
                    const hasMore = nextOffset < matched.length;
                    this.toast({
                        icon: 'users',
                        segments: [
                            'In LearnCard, this lists who received it. ',
                            { b: String(matched.length) },
                            ' so far in practice.',
                        ],
                    });
                    return Promise.resolve({
                        records: page.map(c => this.toRecipientRecord(c)),
                        hasMore,
                        ...(hasMore ? { cursor: String(nextOffset) } : {}),
                        total: matched.length,
                    });
                }

                case 'send-notification': {
                    const title = typeof event.title === 'string' ? event.title : '';
                    const body = typeof event.body === 'string' ? event.body : '';
                    const text = [title, body].filter(Boolean).join(' — ');
                    this.toast({
                        icon: 'bell',
                        segments: text
                            ? ['The learner would get a notification: ', { b: text }]
                            : ['In LearnCard, the learner would get a notification.'],
                    });
                    return Promise.resolve({ sent: true });
                }

                case 'increment-counter': {
                    const key = String(event.key ?? '');
                    const amount = typeof event.amount === 'number' ? event.amount : 0;
                    const previous = this.readCounter(key)?.value ?? 0;
                    const next = previous + amount;
                    this.writeCounter(key, next);
                    this.toast({
                        icon: 'hash',
                        segments: ['Counter ', { b: key }, ' → ', { b: String(next) }, '.'],
                    });
                    return Promise.resolve({ key, previousValue: previous, newValue: next });
                }

                case 'get-counter': {
                    const key = String(event.key ?? '');
                    const stored = this.readCounter(key);
                    const value = stored?.value ?? 0;
                    this.toast({
                        icon: 'hash',
                        segments: ['Counter ', { b: key }, ' is ', { b: String(value) }, '.'],
                    });
                    return Promise.resolve({
                        key,
                        value,
                        updatedAt: stored?.updatedAt ?? null,
                    });
                }

                case 'get-counters': {
                    const requested = Array.isArray(event.keys)
                        ? (event.keys as unknown[]).map(String)
                        : this.allCounterKeys();
                    const counters = requested.map(key => {
                        const stored = this.readCounter(key);
                        return {
                            key,
                            value: stored?.value ?? 0,
                            updatedAt: stored?.updatedAt ?? null,
                        };
                    });
                    this.toast({
                        icon: 'hash',
                        segments: ['Read ', { b: plural(counters.length, 'counter') }, '.'],
                    });
                    return Promise.resolve({ counters });
                }

                case 'send-ai-session-credential': {
                    const sessionTitle =
                        typeof event.sessionTitle === 'string' && event.sessionTitle
                            ? event.sessionTitle
                            : 'AI session';
                    const sessionBoostUri = this.nextUri('lc:mock:session-boost');
                    const record = this.addCredential({
                        name: sessionTitle,
                        boostUri: sessionBoostUri,
                        status: 'claimed',
                    });
                    this.toast({
                        icon: 'award',
                        tone: 'positive',
                        segments: [
                            'In LearnCard, the learner would keep a record of ',
                            { b: sessionTitle },
                            '.',
                        ],
                    });

                    // Mirrors the real host's topic hierarchy: the first session
                    // creates the app's AI Topic (returning its credential URI);
                    // later sessions reuse it and report isNewTopic: false.
                    const isNewTopic = this.aiTopic === null;
                    if (!this.aiTopic) {
                        this.aiTopic = {
                            topicUri: this.nextUri('lc:mock:topic'),
                            topicCredentialUri: this.nextUri('lc:mock:topic-credential'),
                        };
                    }

                    return Promise.resolve({
                        topicUri: this.aiTopic.topicUri,
                        ...(isNewTopic
                            ? { topicCredentialUri: this.aiTopic.topicCredentialUri }
                            : {}),
                        sessionCredentialUri: record.credentialUri,
                        sessionBoostUri,
                        isNewTopic,
                    });
                }

                default:
                    this.toast({
                        icon: 'sparkles',
                        segments: ['In LearnCard, this would run ', { b: type }, '.'],
                    });
                    return Promise.resolve({});
            }
        })();

        return response.then(result => {
            this.captureHandledAppEvent(type, event);
            return result;
        });
    }

    private captureHandledAction(action: string, payload?: unknown): void {
        try {
            this.updateManifest(draft => {
                switch (action) {
                    case 'REQUEST_IDENTITY':
                        this.addPermission(draft, 'request_identity');
                        break;
                    case 'SEND_CREDENTIAL':
                        this.addPermission(draft, 'send_credential');
                        break;
                    case 'REQUEST_CONSENT': {
                        this.addPermission(draft, 'request_consent');
                        const scopes = (payload as { scopes?: unknown } | undefined)?.scopes;
                        if (scopes && typeof scopes === 'object' && !Array.isArray(scopes)) {
                            this.captureConsentRecord(draft, scopes as ConsentRequest);
                        }
                        break;
                    }
                    case 'LAUNCH_FEATURE': {
                        this.addPermission(draft, 'launch_feature');
                        const featurePath = (payload as { featurePath?: unknown } | undefined)
                            ?.featurePath;
                        if (typeof featurePath === 'string' && featurePath) {
                            this.addUnique(draft.featuresLaunched, featurePath);
                        }
                        break;
                    }
                    case 'ASK_CREDENTIAL_SEARCH':
                        this.addPermission(draft, 'credential_search');
                        break;
                    case 'ASK_CREDENTIAL_SPECIFIC':
                        this.addPermission(draft, 'credential_by_id');
                        break;
                    case 'INITIATE_TEMPLATE_ISSUE':
                        this.addPermission(draft, 'template_issuance');
                        break;
                    case 'REQUEST_LEARNER_CONTEXT':
                        draft.usedLearnerContext = true;
                        break;
                    default:
                        break;
                }
            });
        } catch {
            // Capture must never affect mocked app behavior.
        }
    }

    private captureHandledAppEvent(type: string, event: Record<string, unknown>): void {
        try {
            this.updateManifest(draft => {
                switch (type) {
                    case 'send-credential': {
                        this.addPermission(draft, 'send_credential');
                        if (
                            typeof event.alias === 'string' &&
                            event.alias &&
                            event.template &&
                            typeof event.template === 'object'
                        ) {
                            const version =
                                this.inlineTemplateVersions.get(event.alias)?.version ?? 1;
                            this.captureTemplateRecord(
                                draft,
                                event.alias,
                                event.template as InlineCredentialTemplate,
                                version
                            );
                        }
                        break;
                    }
                    case 'send-notification':
                        draft.usedNotifications = true;
                        break;
                    case 'increment-counter':
                    case 'get-counter': {
                        const key = event.key;
                        if (typeof key === 'string' && key) this.addUnique(draft.counterKeys, key);
                        break;
                    }
                    case 'get-counters': {
                        if (Array.isArray(event.keys)) {
                            for (const key of event.keys) {
                                if (typeof key === 'string' && key) {
                                    this.addUnique(draft.counterKeys, key);
                                }
                            }
                        }
                        break;
                    }
                    default:
                        break;
                }
            });
        } catch {
            // Capture must never affect mocked app behavior.
        }
    }

    private updateManifest(mutator: (manifest: CapturedAppManifest) => void): void {
        const manifest = this.loadManifest() ?? this.createManifestSkeleton();
        const next = this.cloneManifest(manifest);

        mutator(next);

        const now = new Date().toISOString();
        next.firstCapturedAt ||= now;
        next.lastUpdatedAt = now;

        this.saveManifest(next);
        this.updateManifestHud(next);
        this.refreshPublishPromptLink(next);
        this.maybeShowPublishPrompt(next);
        this.captureIcon();
    }

    private createManifestSkeleton(): CapturedAppManifest {
        const now = new Date().toISOString();
        const suggestedName = this.readSuggestedName();
        const suggestedIconUrl = this.readSuggestedIconUrl();

        return {
            manifestVersion: 1,
            appKey: this.getAppKey(),
            appUrl: this.readAppOrigin(),
            ...(suggestedName ? { suggestedName } : {}),
            ...(suggestedIconUrl ? { suggestedIconUrl } : {}),
            permissions: [],
            templates: [],
            consentRequests: [],
            featuresLaunched: [],
            counterKeys: [],
            usedLearnerContext: false,
            usedNotifications: false,
            firstCapturedAt: now,
            lastUpdatedAt: now,
        };
    }

    private readAppOrigin(): string {
        if (typeof window === 'undefined' || !window.location?.origin) return '';
        return `${window.location.origin}${window.location.pathname || ''}`;
    }

    private readSuggestedName(): string | undefined {
        const title = this.readInitialDocumentTitle();
        if (!title) return undefined;

        const trimmedTitle = title.trim();
        if (!trimmedTitle) return undefined;

        return trimmedTitle.slice(0, 100);
    }

    private readInitialDocumentTitle(): string | undefined {
        if (this.initialDocumentTitle !== undefined) {
            return this.initialDocumentTitle ?? undefined;
        }

        if (typeof document === 'undefined') {
            this.initialDocumentTitle = null;
            return undefined;
        }

        this.initialDocumentTitle = document.title;
        return this.initialDocumentTitle || undefined;
    }

    private getAppFingerprint(): string {
        if (this.appFingerprint) return this.appFingerprint;

        this.appFingerprint = slugifyAppFingerprint(
            this.options.appId ?? this.readInitialDocumentTitle() ?? undefined
        );

        return this.appFingerprint;
    }

    private readLegacyManifestFingerprint(manifest: CapturedAppManifest): string {
        return slugifyAppFingerprint(manifest.suggestedName);
    }

    private readSuggestedIconUrl(): string | undefined {
        return this.iconCandidates().find(url => /^https?:/.test(url));
    }

    private appKeyStorageKey(): string {
        return `${this.options.namespace}:app-key:${this.getAppFingerprint()}`;
    }

    private getAppKey(): string {
        if (this.options.appId !== undefined) return this.options.appId;
        if (this.options.persist) {
            try {
                this.memoryAppKey =
                    localStorage.getItem(this.appKeyStorageKey()) || this.memoryAppKey;
            } catch {
                /* Use the session fallback. */
            }
        }
        this.memoryAppKey ??=
            globalThis.crypto?.randomUUID?.() ??
            `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        if (this.options.persist) {
            try {
                localStorage.setItem(this.appKeyStorageKey(), this.memoryAppKey);
            } catch {
                /* Use the session fallback. */
            }
        }
        return this.memoryAppKey;
    }

    private iconFallback(): string | undefined {
        return typeof window !== 'undefined'
            ? this.resolveIcon('/favicon.ico', window.location.origin)
            : undefined;
    }

    private resolveIcon(href: string, base: string): string | undefined {
        try {
            const url = new URL(href, base);
            return ['http:', 'https:', 'data:'].includes(url.protocol) ? url.href : undefined;
        } catch {
            return undefined;
        }
    }

    private iconSize(sizes: string, type: string): number {
        if (sizes.toLowerCase().split(/\s+/).includes('any') || type === 'image/svg+xml')
            return Number.MAX_SAFE_INTEGER;
        return Math.max(
            0,
            ...sizes.split(/\s+/).map(size => {
                const match = /^(\d+)x(\d+)$/i.exec(size);
                return match ? Number(match[1]) * Number(match[2]) : 0;
            })
        );
    }

    private iconCandidates(): string[] {
        if (typeof document === 'undefined') return [];
        return Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel]'))
            .map(link => {
                const rels = link.rel.toLowerCase().split(/\s+/);
                const priority = rels.includes('mask-icon')
                    ? 0
                    : rels.some(
                            rel =>
                                rel === 'apple-touch-icon' || rel === 'apple-touch-icon-precomposed'
                        )
                      ? 2
                      : rels.includes('icon')
                        ? 1
                        : 0;
                return {
                    priority,
                    size: this.iconSize(link.getAttribute('sizes') ?? '', link.type),
                    url: this.resolveIcon(link.href, document.baseURI),
                };
            })
            .filter(candidate => candidate.priority > 0 && candidate.url)
            .sort((a, b) => b.priority - a.priority || b.size - a.size)
            .flatMap(candidate => (candidate.url ? [candidate.url] : []));
    }

    private cancelIconCapture(): void {
        this.iconGeneration++;
        for (const cleanup of this.iconCleanups) cleanup();
        this.iconCleanups.clear();
        this.iconSource = undefined;
    }

    private captureIcon(): void {
        if (this.destroyed || typeof document === 'undefined') return;
        const candidates = this.iconCandidates();
        const manifestHref = document.querySelector<HTMLLinkElement>('link[rel~="manifest"]')?.href;
        const signature = JSON.stringify([candidates, manifestHref]);
        if (signature === this.iconSource) return;
        this.cancelIconCapture();
        this.iconSource = signature;
        const generation = this.iconGeneration;
        void (async () => {
            let source: string | undefined = candidates[0];
            let url = candidates.find(candidate => /^https?:/.test(candidate));
            if (
                (!source || !url) &&
                manifestHref &&
                new URL(manifestHref).origin === window.location.origin
            ) {
                const controller = new AbortController();
                let rejectPending: (reason: Error) => void = () => undefined;
                const timeout = new Promise<never>((_, reject) => {
                    rejectPending = reject;
                });
                const cleanup = (): void => {
                    clearTimeout(timer);
                    controller.abort();
                    rejectPending(new Error('Icon capture cancelled'));
                };
                const timer = setTimeout(cleanup, 4000);
                this.iconCleanups.add(cleanup);
                try {
                    const data: unknown = await Promise.race([
                        fetch(manifestHref, { signal: controller.signal, redirect: 'error' }).then(
                            response => {
                                if (!response.ok) return undefined;
                                return response.json() as Promise<unknown>;
                            }
                        ),
                        timeout,
                    ]);
                    {
                        const icons =
                            data && typeof data === 'object' && 'icons' in data
                                ? data.icons
                                : undefined;
                        if (Array.isArray(icons)) {
                            const ranked = icons
                                .filter(
                                    (
                                        icon
                                    ): icon is { src: string; sizes?: string; type?: string } =>
                                        !!icon &&
                                        typeof icon === 'object' &&
                                        typeof icon.src === 'string'
                                )
                                .sort(
                                    (a, b) =>
                                        this.iconSize(
                                            typeof b.sizes === 'string' ? b.sizes : '',
                                            b.type ?? ''
                                        ) -
                                        this.iconSize(
                                            typeof a.sizes === 'string' ? a.sizes : '',
                                            a.type ?? ''
                                        )
                                )
                                .flatMap(icon => {
                                    const href = this.resolveIcon(icon.src, manifestHref);
                                    return href ? [href] : [];
                                });
                            source ??= ranked[0];
                            url ??= ranked.find(href => /^https?:/.test(href));
                        }
                    }
                } catch {
                    /* Icon discovery is best effort. */
                } finally {
                    cleanup();
                    this.iconCleanups.delete(cleanup);
                }
            }
            if (this.destroyed || generation !== this.iconGeneration) return;
            const fallback = url ? undefined : this.iconFallback();
            url ??= fallback;
            source ??= url;
            const result = source ? await this.rasterizeIcon(source) : undefined;
            if (this.destroyed || generation !== this.iconGeneration) return;
            const manifest = this.loadManifest();
            if (!manifest) return;
            // A guessed /favicon.ico, or a same-origin icon that fails to load, is broken.
            // Cross-origin failures stay: a missing CORS header looks like an error too.
            const isSameOrigin = (href: string): boolean =>
                href.startsWith(window.location.origin + '/');
            const broken =
                result?.status !== 'loaded' &&
                (url === fallback || (!!url && result?.status === 'failed' && isSameOrigin(url)));
            manifest.suggestedIconUrl = broken ? undefined : url;
            manifest.suggestedIconDataUrl = result?.dataUrl;
            this.saveManifest(manifest);
            this.updateManifestHud(manifest);
            this.refreshPublishPromptLink(manifest);
        })().catch(() => undefined);
    }

    private rasterizeIcon(
        source: string
    ): Promise<{ status: 'loaded' | 'failed' | 'timeout'; dataUrl?: string }> {
        return new Promise(resolve => {
            const image = new Image();
            const finish = (status: 'loaded' | 'failed' | 'timeout', dataUrl?: string): void => {
                clearTimeout(timer);
                image.onload = null;
                image.onerror = null;
                this.iconCleanups.delete(cancel);
                resolve({ status, dataUrl });
            };
            const cancel = (): void => {
                finish('timeout');
                image.removeAttribute('src');
            };
            const timer = setTimeout(cancel, 4000);
            this.iconCleanups.add(cancel);
            image.onerror = () => finish('failed');
            image.onload = () => {
                try {
                    if (!image.naturalWidth || !image.naturalHeight) return finish('failed');
                    const canvas = document.createElement('canvas');
                    for (const size of [128, 96, 64]) {
                        canvas.width = canvas.height = size;
                        const context = canvas.getContext('2d');
                        if (!context) break;
                        const ratio = size / Math.max(image.naturalWidth, image.naturalHeight);
                        const width = image.naturalWidth * ratio;
                        const height = image.naturalHeight * ratio;
                        context.drawImage(
                            image,
                            (size - width) / 2,
                            (size - height) / 2,
                            width,
                            height
                        );
                        const data = canvas.toDataURL('image/webp', 0.85);
                        if (data.startsWith('data:image/') && data.length <= 3000)
                            return finish('loaded', data);
                    }
                } catch {
                    /* Tainted or unsupported canvas. */
                }
                finish('loaded');
            };
            if (/^https?:/.test(source) && new URL(source).origin !== window.location.origin)
                image.crossOrigin = 'anonymous';
            image.src = source;
        });
    }

    private manifestStorageKey(): string {
        return `${this.options.namespace}:manifests`;
    }

    private legacyManifestStorageKey(): string {
        return `${this.options.namespace}:manifest`;
    }

    private publishDismissedStorageKey(): string {
        return `${this.options.namespace}:publish-dismissed-at:${this.getAppFingerprint()}`;
    }

    private hudCollapsedStorageKey(): string {
        return `${this.options.namespace}:manifest-hud-collapsed:${this.getAppFingerprint()}`;
    }

    private loadManifestMap(): StoredManifestMap {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const rawMap = localStorage.getItem(this.manifestStorageKey());
                const rawLegacy = localStorage.getItem(this.legacyManifestStorageKey());

                if (!rawMap && !rawLegacy && Object.keys(this.memoryManifests).length > 0) {
                    return this.cloneManifestMap(this.memoryManifests);
                }

                const manifests = rawMap ? this.parseManifestMap(rawMap) : {};

                if (rawLegacy) {
                    try {
                        const legacyManifest = JSON.parse(rawLegacy) as CapturedAppManifest;
                        manifests[this.readLegacyManifestFingerprint(legacyManifest)] =
                            this.cloneManifest(legacyManifest);
                        localStorage.setItem(this.manifestStorageKey(), JSON.stringify(manifests));
                        localStorage.removeItem(this.legacyManifestStorageKey());
                    } catch {
                        // Ignore corrupt legacy data and leave it in place.
                    }
                }

                this.replaceMemoryManifestMap(manifests);
                return this.cloneManifestMap(manifests);
            } catch {
                // Ignore and fall back to memory.
            }
        }

        return this.cloneManifestMap(this.memoryManifests);
    }

    private parseManifestMap(raw: string): StoredManifestMap {
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

        const manifests: StoredManifestMap = {};
        for (const [fingerprint, manifest] of Object.entries(parsed)) {
            if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) continue;
            manifests[fingerprint] = this.cloneManifest(manifest as CapturedAppManifest);
        }

        return manifests;
    }

    private cloneManifestMap(manifests: StoredManifestMap): StoredManifestMap {
        const clone: StoredManifestMap = {};
        for (const [fingerprint, manifest] of Object.entries(manifests)) {
            clone[fingerprint] = this.cloneManifest(manifest);
        }

        return clone;
    }

    private replaceMemoryManifestMap(manifests: StoredManifestMap): void {
        for (const key of Object.keys(this.memoryManifests)) delete this.memoryManifests[key];
        for (const [key, manifest] of Object.entries(manifests)) {
            this.memoryManifests[key] = this.cloneManifest(manifest);
        }
    }

    private loadManifest(): CapturedAppManifest | undefined {
        const manifests = this.loadManifestMap();
        const manifest = manifests[this.getAppFingerprint()];
        if (
            manifest &&
            (!manifest.appKey ||
                (this.options.appId !== undefined && manifest.appKey !== this.options.appId))
        ) {
            manifest.appKey = this.getAppKey();
            this.saveManifest(manifest);
        }
        return manifest ? this.cloneManifest(manifest) : undefined;
    }

    private saveManifest(manifest: CapturedAppManifest): void {
        const manifests = this.loadManifestMap();
        manifests[this.getAppFingerprint()] = this.cloneManifest(manifest);

        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.manifestStorageKey(), JSON.stringify(manifests));
                this.replaceMemoryManifestMap(manifests);
                return;
            } catch {
                // Ignore and fall back to memory.
            }
        }

        this.replaceMemoryManifestMap(manifests);
    }

    private loadPublishDismissedAt(): string | undefined {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(this.publishDismissedStorageKey());
                if (raw) return raw;
            } catch {
                // Ignore and fall back to memory.
            }
        }

        return this.memoryPublishDismissedAt[this.getAppFingerprint()];
    }

    private savePublishDismissedAt(value: string): void {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.publishDismissedStorageKey(), value);
                this.memoryPublishDismissedAt[this.getAppFingerprint()] = value;
                return;
            } catch {
                // Ignore and fall back to memory.
            }
        }

        this.memoryPublishDismissedAt[this.getAppFingerprint()] = value;
    }

    private loadHudCollapsed(): boolean {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(this.hudCollapsedStorageKey());
                if (raw === 'true') return true;
                if (raw === 'false') return false;
            } catch {
                // Ignore and fall back to memory.
            }
        }

        const raw = this.memoryHudCollapsed[this.getAppFingerprint()];
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return true;
    }

    private saveHudCollapsed(value: boolean): void {
        const serialized = value ? 'true' : 'false';

        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.hudCollapsedStorageKey(), serialized);
                this.memoryHudCollapsed[this.getAppFingerprint()] = serialized;
                return;
            } catch {
                // Ignore and fall back to memory.
            }
        }

        this.memoryHudCollapsed[this.getAppFingerprint()] = serialized;
    }

    private addPermission(manifest: CapturedAppManifest, permission: string): void {
        this.addUnique(manifest.permissions, permission);
    }

    private addUnique(values: string[], value: string): void {
        if (!values.includes(value)) values.push(value);
    }

    private captureTemplateRecord(
        manifest: CapturedAppManifest,
        alias: string,
        template: InlineCredentialTemplate,
        version: number
    ): void {
        const now = new Date().toISOString();
        const existingIndex = manifest.templates.findIndex(record => record.alias === alias);
        const nextRecord: CapturedTemplateRecord = {
            alias,
            template,
            version,
            lastUsedAt: now,
        };

        if (existingIndex >= 0) {
            manifest.templates[existingIndex] = nextRecord;
            return;
        }

        manifest.templates.push(nextRecord);
    }

    private captureConsentRecord(manifest: CapturedAppManifest, scopes: ConsentRequest): void {
        const normalized = normalizeConsentRequest(scopes);
        const key = canonicalConsentScopeString(normalized);
        const now = new Date().toISOString();
        const existing = manifest.consentRequests.find(
            record => canonicalConsentScopeString(record.scopes) === key
        );

        if (existing) {
            existing.lastUsedAt = now;
            if (!existing.reason && typeof scopes.reason === 'string' && scopes.reason) {
                existing.reason = scopes.reason;
            }
            return;
        }

        const nextRecord: CapturedConsentRecord = {
            scopes: normalized,
            ...(typeof scopes.reason === 'string' && scopes.reason
                ? { reason: scopes.reason }
                : {}),
            lastUsedAt: now,
        };
        manifest.consentRequests.push(nextRecord);
    }

    private cloneManifest(manifest: CapturedAppManifest): CapturedAppManifest {
        return JSON.parse(JSON.stringify(manifest)) as CapturedAppManifest;
    }

    private isManifestPublishable(manifest: CapturedAppManifest): boolean {
        return manifest.templates.length >= 1 || manifest.permissions.length >= 2;
    }

    /**
     * True when publish links would point at production LearnCard from a
     * machine that is almost certainly running LearnCard locally — the one
     * case where the developer probably wants the override.
     */
    private shouldHintLocalPublishOverride(): boolean {
        if (this.context.publishOriginPinned) return false;
        if (this.options.publishOrigin !== DEFAULT_PUBLISH_ORIGIN) return false;
        if (typeof window === 'undefined') return false;

        const hostname = window.location?.hostname;

        return hostname === 'localhost' || hostname === '127.0.0.1';
    }

    public getPublishUrl(manifest: CapturedAppManifest): string;
    public getPublishUrl(): string | undefined;
    public getPublishUrl(manifest = this.loadManifest()): string | undefined {
        if (!manifest) return undefined;
        const prefix = `${this.options.publishOrigin}/app-store/developer/submit?manifest=`;
        const url = prefix + encodeManifestForUrl(manifest);
        if (url.length <= 7000) return url;
        const compact = { ...manifest };
        delete compact.suggestedIconDataUrl;
        return prefix + encodeManifestForUrl(compact);
    }

    private maybeShowPublishPrompt(manifest: CapturedAppManifest): void {
        if (!this.options.publishPrompt || !this.options.ui || !hasDocument()) return;
        if (this.publishPromptShown || !this.isManifestPublishable(manifest)) return;

        const dismissedAt = this.loadPublishDismissedAt();
        if (dismissedAt) {
            const dismissedMs = Date.parse(dismissedAt);
            if (Number.isFinite(dismissedMs) && Date.now() - dismissedMs < PUBLISH_DISMISS_TTL_MS) {
                return;
            }
        }

        this.publishPromptShown = true;
        this.toast({
            icon: 'publish',
            tone: 'publish',
            persistent: true,
            dismissible: true,
            title: 'Ready to publish',
            action: {
                label: 'Publish to LearnCard',
                href: this.getPublishUrl(manifest),
            },
            segments: [
                'Your app works with LearnCard. Put it in front of learners in a few steps.',
            ],
        });
    }

    private refreshPublishPromptLink(manifest: CapturedAppManifest): void {
        const link = this.stackEl?.querySelector<HTMLAnchorElement>(
            '.lc-mock-toast--publish .lc-mock-action'
        );
        if (link) link.href = this.getPublishUrl(manifest);
    }

    private describeFeatures(manifest: CapturedAppManifest): HudFeature[] {
        const features: HudFeature[] = [];

        for (const permission of manifest.permissions) {
            const known = PERMISSION_FEATURES[permission];
            const feature: HudFeature = known
                ? { ...known }
                : { icon: 'sparkles', label: permission.replace(/_/g, ' ') };

            if (permission === 'send_credential' && manifest.templates.length > 0) {
                feature.detail = manifest.templates.map(readableTemplateName).join(', ');
            }

            if (permission === 'request_consent') {
                if (needsConsentSetup(manifest)) {
                    feature.detail = 'Not set up yet';
                    feature.needsSetup = true;
                } else {
                    feature.detail = this.formatConsentSummary(manifest);
                }
            }

            if (permission === 'launch_feature' && manifest.featuresLaunched.length > 0) {
                feature.detail = Array.from(
                    new Set(manifest.featuresLaunched.map(readablePath))
                ).join(', ');
            }

            features.push(feature);
        }

        if (manifest.templates.length > 0 && !manifest.permissions.includes('send_credential')) {
            features.push({
                icon: 'award',
                label: 'Award credentials',
                detail: manifest.templates.map(readableTemplateName).join(', '),
            });
        }

        if (manifest.usedLearnerContext) {
            features.push({ icon: 'sparkles', label: 'Personalize with the learner’s profile' });
        }

        if (manifest.usedNotifications) {
            features.push({ icon: 'bell', label: 'Send notifications' });
        }

        if (manifest.counterKeys.length > 0) {
            features.push({
                icon: 'hash',
                label: 'Track progress',
                detail: manifest.counterKeys.join(', '),
            });
        }

        return features;
    }

    private formatConsentSummary(manifest: CapturedAppManifest): string | undefined {
        if (manifest.consentRequests.length === 0) return undefined;

        const readCategories = new Set<string>();
        const personalFields = new Set<string>();
        const writeCategories = new Set<string>();

        for (const request of manifest.consentRequests) {
            request.scopes.read.credentialCategories.forEach(category =>
                readCategories.add(category)
            );
            request.scopes.read.personalFields.forEach(field => personalFields.add(field));
            request.scopes.write.credentialCategories.forEach(category =>
                writeCategories.add(category)
            );
        }

        const parts: string[] = [];
        if (readCategories.size > 0) parts.push(`See ${[...readCategories].join(', ')}`);
        if (personalFields.size > 0) parts.push(`See ${[...personalFields].join(', ')}`);
        if (writeCategories.size > 0) parts.push(`Add ${[...writeCategories].join(', ')}`);

        return parts.join(' · ') || undefined;
    }

    private copyText(text: string): void {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).catch(() => undefined);
            return;
        }

        if (!hasDocument() || !document.body) return;

        const input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', 'true');
        Object.assign(input.style, {
            position: 'fixed',
            opacity: '0',
            pointerEvents: 'none',
        });
        document.body.appendChild(input);
        input.select();

        try {
            document.execCommand('copy');
        } catch {
            // Ignore copy failures in sandboxed/older environments.
        }

        input.remove();
    }

    private warnIfFingerprintCollides(): void {
        const manifest = this.loadManifest();
        const currentAppUrl = this.readAppOrigin();

        if (!manifest || !currentAppUrl || manifest.appUrl === currentAppUrl) return;

        console.warn(
            `${MOCK_PREFIX} Existing manifest state for fingerprint "${this.getAppFingerprint()}" ` +
                `belongs to ${manifest.appUrl}, but this page is ${currentAppUrl}. ` +
                'Two apps may be sharing mock state. Pass mockOptions.appId to isolate them.'
        );
    }

    private updateManifestHud(manifest?: CapturedAppManifest): void {
        if (!this.options.ui || !hasDocument() || !document.body) return;

        const currentManifest = manifest ?? this.loadManifest();
        if (!currentManifest) {
            if (this.hudEl) this.hudEl.style.display = 'none';
            return;
        }

        this.ensureStyles();

        if (!this.hudEl || !document.body.contains(this.hudEl)) {
            const hud = createEl('div', 'lc-mock-hud');
            hud.setAttribute('role', 'region');
            hud.setAttribute('aria-label', 'LearnCard practice mode');
            document.body.appendChild(hud);
            this.domNodes.add(hud);
            this.hudEl = hud;
            this.hudAnimateNext = true;
        }

        const hud = this.hudEl;
        hud.style.display = '';
        hud.replaceChildren(
            this.confirmingReset
                ? this.renderResetConfirmation()
                : this.loadHudCollapsed()
                  ? this.renderHudPill(currentManifest)
                  : this.renderHudCard(currentManifest)
        );

        hud.classList.toggle('lc-mock-animate', this.hudAnimateNext);
        this.hudAnimateNext = false;
    }

    private setHudCollapsed(collapsed: boolean, manifest: CapturedAppManifest): void {
        this.saveHudCollapsed(collapsed);
        this.hudAnimateNext = true;
        this.updateManifestHud(manifest);
        const focusTarget = this.hudEl?.querySelector<HTMLElement>(
            collapsed ? '.lc-mock-hud-pill' : '.lc-mock-hud-minimize'
        );
        focusTarget?.focus({ preventScroll: true });
    }

    private renderHudPill(manifest: CapturedAppManifest): HTMLElement {
        const count = this.describeFeatures(manifest).length;
        const pill = createEl('button', 'lc-mock-hud-pill lc-mock-glass');
        pill.type = 'button';
        pill.setAttribute('aria-expanded', 'false');
        pill.setAttribute(
            'aria-label',
            `LearnCard practice mode. Your app uses ${plural(count, 'feature')}. Show details.`
        );

        const mark = createEl('span', 'lc-mock-hud-mark');
        mark.appendChild(createIcon('mark'));

        const label = createEl('span', 'lc-mock-hud-pill-label', 'Practice mode');
        const badge = createEl('span', 'lc-mock-hud-badge', String(count));

        pill.append(mark, createEl('span', 'lc-mock-dot'), label, badge);
        pill.addEventListener('click', () => this.setHudCollapsed(false, manifest));

        return pill;
    }

    private renderHudCard(manifest: CapturedAppManifest): HTMLElement {
        const card = createEl('div', 'lc-mock-hud-card lc-mock-glass');

        const header = createEl('div', 'lc-mock-hud-header');
        const mark = createEl('span', 'lc-mock-hud-mark lc-mock-hud-mark--lg');
        mark.appendChild(createIcon('mark'));

        const heading = createEl('div', 'lc-mock-hud-heading');
        const title = createEl('div', 'lc-mock-hud-title');
        title.append(createEl('span', undefined, 'Practice mode'), createEl('span', 'lc-mock-dot'));
        heading.append(
            title,
            createEl('div', 'lc-mock-hud-subtitle', 'LearnCard actions are simulated here.')
        );

        const minimize = createEl('button', 'lc-mock-hud-minimize');
        minimize.type = 'button';
        minimize.setAttribute('aria-label', 'Minimize');
        minimize.setAttribute('aria-expanded', 'true');
        minimize.title = 'Minimize';
        minimize.appendChild(createIcon('chevronDown'));
        minimize.addEventListener('click', () => this.setHudCollapsed(true, manifest));

        header.append(mark, heading, minimize);
        card.appendChild(header);

        card.appendChild(this.renderHudApp(manifest));

        const features = this.describeFeatures(manifest);
        card.appendChild(
            createEl(
                'div',
                'lc-mock-hud-section',
                features.length > 0 ? 'What your app uses' : 'Nothing yet'
            )
        );

        const list = createEl('ul', 'lc-mock-hud-group lc-mock-hud-list');
        if (features.length === 0) {
            list.appendChild(
                createEl(
                    'li',
                    'lc-mock-hud-empty',
                    'Use a LearnCard feature in your app and it will show up here.'
                )
            );
        }

        for (const feature of features) {
            const row = createEl('li', 'lc-mock-hud-row');
            const glyph = createEl('span', 'lc-mock-hud-glyph');
            glyph.appendChild(createIcon(feature.icon));

            const text = createEl('div', 'lc-mock-hud-row-text');
            text.appendChild(createEl('div', 'lc-mock-hud-row-label', feature.label));
            if (feature.detail) {
                const detail = createEl(
                    'div',
                    `lc-mock-hud-row-detail${feature.needsSetup ? ' is-setup' : ''}`,
                    feature.detail
                );
                detail.title = feature.needsSetup
                    ? 'You can choose what to ask for when you publish.'
                    : feature.detail;
                text.appendChild(detail);
            }

            const status = createEl(
                'span',
                feature.needsSetup ? 'lc-mock-hud-setup-dot' : 'lc-mock-hud-check'
            );
            if (feature.needsSetup) status.setAttribute('aria-label', 'Needs setup');
            else status.appendChild(createIcon('check'));

            row.append(glyph, text, status);
            list.appendChild(row);
        }
        card.appendChild(list);

        card.appendChild(this.renderHudFooter(manifest));
        const reset = createEl('button', 'lc-mock-hud-reset', 'Start over');
        reset.type = 'button';
        reset.addEventListener('click', () => {
            this.confirmingReset = true;
            this.updateManifestHud();
            this.hudEl?.querySelector<HTMLButtonElement>('.lc-mock-hud-reset-cancel')?.focus();
        });
        card.appendChild(reset);

        if (this.shouldHintLocalPublishOverride()) {
            const hint = createEl('div', 'lc-mock-hud-publish-hint', 'Local LearnCard? Add ');
            hint.appendChild(
                createEl('code', undefined, '?lc_publish_override=http://localhost:3000')
            );
            card.appendChild(hint);
        }

        return card;
    }

    private renderResetConfirmation(): HTMLElement {
        const card = createEl('div', 'lc-mock-hud-card lc-mock-glass');
        const body = createEl('div', 'lc-mock-hud-confirm');
        body.append(
            createEl('div', 'lc-mock-hud-title', 'Start over with this app?'),
            createEl(
                'p',
                undefined,
                "This clears what LearnCard recorded here — features, practice credentials, and counters. Your code isn't touched, and nothing already in LearnCard changes."
            )
        );
        const actions = createEl('div', 'lc-mock-hud-confirm-actions');
        const cancel = createEl('button', 'lc-mock-hud-reset-cancel', 'Cancel');
        const confirm = createEl('button', 'lc-mock-hud-reset-confirm', 'Start Over');
        cancel.type = confirm.type = 'button';
        const restore = (): void => {
            this.confirmingReset = false;
            this.updateManifestHud();
            this.hudEl?.querySelector<HTMLButtonElement>('.lc-mock-hud-reset')?.focus();
        };
        cancel.addEventListener('click', restore);
        card.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                restore();
            }
        });
        confirm.addEventListener('click', () => this.resetPracticeMode());
        actions.append(cancel, confirm);
        body.appendChild(actions);
        card.appendChild(body);
        return card;
    }

    private renderHudApp(manifest: CapturedAppManifest): HTMLElement {
        const app = createEl('div', 'lc-mock-hud-group lc-mock-hud-app');
        const name = manifest.suggestedName || 'Untitled app';

        const avatar = createEl('span', 'lc-mock-hud-avatar');
        const initial = name.trim().charAt(0).toUpperCase() || 'A';
        const icon = manifest.suggestedIconDataUrl ?? manifest.suggestedIconUrl;
        if (icon) {
            const img = createEl('img');
            img.alt = '';
            img.src = icon;
            img.addEventListener('error', () => {
                img.remove();
                avatar.textContent = initial;
            });
            avatar.appendChild(img);
        } else {
            avatar.textContent = initial;
        }

        const text = createEl('div', 'lc-mock-hud-row-text');
        text.appendChild(createEl('div', 'lc-mock-hud-app-name', name));

        const host = readHost(manifest.appUrl);
        if (host) text.appendChild(createEl('div', 'lc-mock-hud-row-detail', host));

        app.append(avatar, text);
        return app;
    }

    private renderHudFooter(manifest: CapturedAppManifest): HTMLElement {
        const publishUrl = this.getPublishUrl(manifest);
        const footer = createEl('div', 'lc-mock-hud-footer');

        const publish = createEl('a', 'lc-mock-hud-publish');
        publish.href = publishUrl;
        publish.target = '_blank';
        publish.rel = 'noopener';
        publish.append(createEl('span', undefined, 'Publish app'), createIcon('open'));

        const copy = createEl('button', 'lc-mock-hud-copy');
        copy.type = 'button';
        copy.title = 'Copy publish link';
        copy.setAttribute('aria-label', 'Copy publish link');
        copy.appendChild(createIcon('copy'));
        copy.addEventListener('click', () => {
            this.copyText(publishUrl);
            copy.classList.add('is-copied');
            copy.replaceChildren(createIcon('check'));
            copy.title = 'Link copied';
            copy.setAttribute('aria-label', 'Link copied');

            const reset = setTimeout(() => {
                this.exitTimers.delete(reset);
                copy.classList.remove('is-copied');
                copy.replaceChildren(createIcon('copy'));
                copy.title = 'Copy publish link';
                copy.setAttribute('aria-label', 'Copy publish link');
            }, 1800);
            this.exitTimers.add(reset);
        });

        footer.append(publish, copy);
        return footer;
    }

    private nextUri(prefix: string): string {
        this.idSeq += 1;
        return `${prefix}:${Date.now()}-${this.idSeq}`;
    }

    private buildMockVc(name: string, id: string): Record<string, unknown> {
        return {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            id,
            type: ['VerifiableCredential'],
            issuer: this.identity.did,
            credentialSubject: { id: this.identity.did, achievement: { name } },
            _mock: true,
        };
    }

    private addCredential(input: {
        name: string;
        templateAlias?: string;
        boostUri?: string;
        recipient?: string;
        status?: MockStatus;
        credentialUri?: string;
        credential?: unknown;
    }): MockCredential {
        const now = new Date().toISOString();
        const status: MockStatus = input.status ?? 'claimed';
        const credentialUri = input.credentialUri ?? this.nextUri('lc:mock:credential');
        const record: MockCredential = {
            credentialUri,
            boostUri: input.boostUri,
            templateAlias: input.templateAlias,
            name: input.name,
            recipient: input.recipient || this.identity.did,
            status,
            sentDate: now,
            claimedDate: status === 'claimed' ? now : undefined,
            receivedDate: status === 'claimed' ? now : undefined,
            credential: input.credential ?? this.buildMockVc(input.name, credentialUri),
        };
        this.credentials.push(record);
        return record;
    }

    private selfCredentials(): MockCredential[] {
        return this.credentials.filter(c => c.recipient === this.identity.did);
    }

    private matchesTemplate(c: MockCredential, q: TemplateQuery): boolean {
        if (typeof q.templateAlias === 'string') return c.templateAlias === q.templateAlias;
        if (typeof q.boostUri === 'string') return c.boostUri === q.boostUri;
        return false;
    }

    private toRecipientRecord(c: MockCredential): {
        recipientProfileId: string;
        recipientDisplayName: string;
        sentDate: string;
        claimedDate?: string;
        credentialUri: string;
        status: MockStatus;
    } {
        return {
            recipientProfileId: c.recipient,
            recipientDisplayName: c.recipient,
            sentDate: c.sentDate,
            claimedDate: c.claimedDate,
            credentialUri: c.credentialUri,
            status: c.status,
        };
    }

    private counterStorageKey(): string {
        return `${this.options.namespace}:counters:${this.getAppFingerprint()}`;
    }

    private loadCounters(): Record<string, StoredCounter> {
        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const raw = localStorage.getItem(this.counterStorageKey());
                if (raw) return JSON.parse(raw) as Record<string, StoredCounter>;
            } catch {
                // Corrupt or unavailable storage: fall through to in-memory.
            }
        }

        const fromMemory: Record<string, StoredCounter> = {};
        for (const [key, value] of this.memoryCounters) fromMemory[key] = value;
        return fromMemory;
    }

    private readCounter(key: string): StoredCounter | undefined {
        return this.loadCounters()[key];
    }

    private allCounterKeys(): string[] {
        return Object.keys(this.loadCounters());
    }

    /**
     * The load → patch → save cycle below runs synchronously within one task,
     * so increments in the same tab can never interleave. Concurrent writes
     * from *other tabs* sharing the namespace can still be lost — acceptable
     * for a dev-only mock, and inherent to `localStorage` without web locks.
     */
    private writeCounter(key: string, value: number): void {
        const entry: StoredCounter = { value, updatedAt: new Date().toISOString() };

        if (this.options.persist && typeof localStorage !== 'undefined') {
            try {
                const all = this.loadCounters();
                all[key] = entry;
                localStorage.setItem(this.counterStorageKey(), JSON.stringify(all));
                return;
            } catch {
                // Fall back to in-memory storage below.
            }
        }

        this.memoryCounters.set(key, entry);
    }

    private log(action: string, payload?: unknown): void {
        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(`${MOCK_PREFIX} ${action}`, payload ?? '');
    }

    private announce(): void {
        this.warnIfFingerprintCollides();
        this.updateManifestHud();

        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(
            `${MOCK_PREFIX} Standalone mock mode is active. The SDK is simulating the ` +
                'LearnCard host locally. When embedded in a real host, these calls run ' +
                'against it unchanged.'
        );
    }

    private showClaimToast(credentialName: string, templateVersion?: number): void {
        const versionSuffix =
            typeof templateVersion === 'number' && templateVersion > 1
                ? ` Template updated to v${templateVersion}.`
                : '';

        this.toast({
            icon: 'award',
            tone: 'positive',
            ttl: 5200,
            segments: [
                'In LearnCard, the learner would receive ',
                { b: credentialName },
                `.${versionSuffix}`,
            ],
        });
    }

    private showConsentToast(payload: unknown, redirectIgnored: boolean): void {
        const scopes = (payload as { scopes?: unknown } | undefined)?.scopes;
        const contractUri = (payload as { contractUri?: unknown } | undefined)?.contractUri;

        if (!scopes && !contractUri) {
            this.toast({
                icon: 'shield',
                tone: 'warning',
                ttl: 8000,
                title: 'Choose what to ask for',
                segments: [
                    'Approved here, but once published LearnCard needs to know what to ask the learner. You can choose it when you publish, or say it in code: ',
                    { b: "requestConsent({ read: { credentialCategories: ['Achievement'] } })" },
                ],
            });
        } else {
            const segments = buildConsentScopeToastSegments(payload);
            if (redirectIgnored) segments.push(' Redirect skipped in practice.');
            this.toast({ icon: 'shield', tone: 'positive', segments });
        }

        if (redirectIgnored) {
            this.note(
                "requestConsent: 'redirect' is ignored in mock mode — the real host would " +
                    "navigate to the contract's redirectUrl with the VP in the URL."
            );
        }
    }

    private note(message: string): void {
        if (!this.options.log) return;
        // eslint-disable-next-line no-console
        console.log(`${MOCK_PREFIX} ${message}`);
    }

    /**
     * Show a branded toast describing what the real host would do. Identical
     * messages coalesce into one toast with a ×N counter so repeated or polled
     * calls never spam the screen.
     */
    private toast(spec: ToastSpec): void {
        if (!this.options.ui || !hasDocument()) return;

        const tone = spec.tone ?? 'default';
        const ttl = spec.ttl ?? 4200;
        const persistent = Boolean(spec.persistent);
        const text = spec.segments.map(s => (typeof s === 'string' ? s : s.b)).join('');
        const actionKey = spec.action ? `|${spec.action.href}|${spec.action.label}` : '';
        const key = `${tone}|${spec.icon}|${spec.title ?? ''}|${text}${actionKey}`;

        const existing = this.activeToasts.get(key);
        if (existing) {
            existing.count += 1;
            existing.countEl.textContent = `×${existing.count}`;
            existing.countEl.style.display = '';
            existing.countEl.classList.remove('lc-mock-bump');
            void existing.countEl.offsetWidth;
            existing.countEl.classList.add('lc-mock-bump');
            this.scheduleToastDismiss(key);
            return;
        }

        const stack = this.ensureStack();
        if (!stack) return;
        this.ensureStyles();

        const toast = createEl('div', `lc-mock-toast lc-mock-glass lc-mock-toast--${tone}`);
        if (spec.dismissible) toast.classList.add('lc-mock-toast--dismissible');

        const tile = createEl('span', 'lc-mock-tile');
        tile.appendChild(createIcon(spec.icon));

        const content = createEl('div', 'lc-mock-content');

        const meta = createEl('div', 'lc-mock-meta');
        const countEl = createEl('span', 'lc-mock-count');
        countEl.style.display = 'none';
        meta.append(
            createEl('span', 'lc-mock-meta-name', 'LearnCard'),
            createEl('span', 'lc-mock-chip', 'Practice'),
            countEl
        );
        content.appendChild(meta);

        if (spec.title) content.appendChild(createEl('div', 'lc-mock-title', spec.title));

        const body = createEl('div', 'lc-mock-body');
        for (const seg of spec.segments) {
            if (typeof seg === 'string') {
                body.append(seg);
            } else {
                body.appendChild(createEl('strong', undefined, seg.b));
            }
        }
        content.appendChild(body);

        if (spec.action) {
            const action = createEl('a', 'lc-mock-action');
            action.href = spec.action.href;
            action.target = '_blank';
            action.rel = 'noopener';
            action.append(createEl('span', undefined, spec.action.label), createIcon('open'));
            content.appendChild(action);
        }

        toast.append(tile, content);

        if (spec.dismissible) {
            const close = createEl('button', 'lc-mock-close');
            close.type = 'button';
            close.setAttribute('aria-label', 'Dismiss');
            close.appendChild(createIcon('close'));
            close.addEventListener('click', () => {
                if (tone === 'publish') {
                    this.savePublishDismissedAt(new Date().toISOString());
                }
                this.dismissToast(key);
            });
            toast.appendChild(close);
        }

        toast.addEventListener('mouseenter', () => {
            const entry = this.activeToasts.get(key);
            if (entry?.timeoutId) {
                clearTimeout(entry.timeoutId);
                entry.timeoutId = null;
            }
        });
        toast.addEventListener('mouseleave', () => this.scheduleToastDismiss(key));

        stack.appendChild(toast);
        this.domNodes.add(toast);

        this.activeToasts.set(key, {
            node: toast,
            timeoutId: null,
            count: 1,
            countEl,
            ttl,
            persistent,
        });
        this.scheduleToastDismiss(key);
        this.refreshToastVisibility();
    }

    private scheduleToastDismiss(key: string): void {
        const entry = this.activeToasts.get(key);
        if (!entry) return;

        if (entry.timeoutId) clearTimeout(entry.timeoutId);
        entry.timeoutId = entry.persistent
            ? null
            : setTimeout(() => this.dismissToast(key), entry.ttl);
    }

    private refreshToastVisibility(): void {
        const transient = Array.from(this.activeToasts.values()).filter(entry => !entry.persistent);
        const hiddenCount = Math.max(0, transient.length - MAX_VISIBLE_TOASTS);

        transient.forEach((entry, index) => {
            entry.node.classList.toggle('lc-mock-toast--hidden', index < hiddenCount);
            entry.node.classList.toggle('lc-mock-toast--older', index < transient.length - 1);
        });
    }

    private dismissToast(key: string): void {
        const entry = this.activeToasts.get(key);
        if (!entry) return;

        this.activeToasts.delete(key);
        if (entry.timeoutId) clearTimeout(entry.timeoutId);
        this.refreshToastVisibility();

        const { node } = entry;
        node.classList.add('lc-mock-out');
        const exitTimer = setTimeout(() => {
            this.exitTimers.delete(exitTimer);
            node.remove();
            this.domNodes.delete(node);
        }, 200);
        this.exitTimers.add(exitTimer);
    }

    private ensureStack(): HTMLElement | null {
        if (!document.body) return null;
        if (this.stackEl && document.body.contains(this.stackEl)) return this.stackEl;

        const stack = createEl('div', 'lc-mock-stack');
        stack.setAttribute('role', 'status');
        stack.setAttribute('aria-live', 'polite');
        document.body.appendChild(stack);
        this.stackEl = stack;
        return stack;
    }

    private ensureStyles(): void {
        if (!this.options.ui || !hasDocument() || this.styleEl || !document.head) return;

        const style = document.createElement('style');
        style.textContent = MOCK_STYLES;
        document.head.appendChild(style);
        this.styleEl = style;
    }
}
