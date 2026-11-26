/**
 * The overlay stack shared by the app-owned overlays (AppPopover, AppLoading, AppToast) and the
 * Ionic overlays still in use (ion-modal, ion-alert, ...). Ports the parts of @ionic/core 8.7.2
 * `utils/overlays.ts` the app relied on, and keeps both kinds behaving as one stack:
 *
 * - Ordering: Ionic appends a presented overlay to `ion-app` (or `body`) and app overlays portal
 *   into the same root when they open, so document order is presentation order for both.
 * - `aria-hidden`: the view container (`ion-router-outlet`, `ion-nav`, `#ion-view-container-root`)
 *   is hidden while any non-toast overlay is presented, and overlays under the top-most one are
 *   hidden, with the same rules Ionic applies (toasts on top keep the overlay under them exposed).
 * - Focus: app popovers and loadings trap focus like their Ionic counterparts. While an app
 *   overlay is on top, the Ionic overlay under it gets Ionic's own `ion-disable-focus-trap` class
 *   so Ionic's document-level trap does not pull focus back into it.
 * - Escape and the hardware back button go to the top-most overlay of either kind, as Ionic's
 *   `getPresentedOverlay()` did: Escape is swallowed while an app overlay is on top (dismissing it
 *   when `backdropDismiss`), and the back button registers just above Ionic's overlay priority.
 */

export type OverlayKind = 'popover' | 'loading' | 'toast';

export type OverlayRole = 'backdrop' | 'timeout' | 'cancel' | string;

export type OverlayDismissDetail<T = unknown> = { data?: T; role?: OverlayRole };

/** What app overlays hand their `onWillDismiss` / `onDidDismiss` callbacks (Ionic's event shape). */
export type OverlayDismissEvent<T = unknown> = CustomEvent<OverlayDismissDetail<T>>;

export type OverlayEntry = {
    el: HTMLElement;
    kind: OverlayKind;
    /** Escape / back button / backdrop dismiss the overlay (Ionic's `backdropDismiss`). */
    backdropDismiss: boolean;
    /**
     * Ionic's two focus traps: `shadow` (ion-popover: focus anywhere outside the host goes back
     * into it) and `scoped` (ion-loading: only focus inside the host but outside its wrapper, i.e.
     * the tab sentinels, is moved). Toasts never trap.
     */
    trap: 'shadow' | 'scoped' | 'none';
    dismiss: (role?: OverlayRole) => void;
    /** Last element focused inside the overlay (Ionic's `lastFocus`). */
    lastFocus?: Element | null;
};

const IONIC_OVERLAYS =
    'ion-alert,ion-action-sheet,ion-loading,ion-modal,ion-picker-legacy,ion-popover,ion-toast';
const APP_OVERLAY_ATTR = 'data-app-overlay';
const FOCUS_TRAP_DISABLE_CLASS = 'ion-disable-focus-trap';
const FOCUS_TRAP_DISABLED_BY_APP = 'data-app-overlay-disabled-trap';
const BACKDROP_NO_SCROLL = 'backdrop-no-scroll';
/** Ionic's OVERLAY_BACK_BUTTON_PRIORITY is 100; app overlays on top must win over it. */
const APP_OVERLAY_BACK_BUTTON_PRIORITY = 100.5;

export const FOCUSABLE =
    '[tabindex]:not([tabindex^="-"]):not([hidden]):not([disabled]), input:not([type=hidden]):not([tabindex^="-"]):not([hidden]):not([disabled]), textarea:not([tabindex^="-"]):not([hidden]):not([disabled]), button:not([tabindex^="-"]):not([hidden]):not([disabled]), select:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-checkbox:not([tabindex^="-"]):not([hidden]):not([disabled]), ion-radio:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable:not([tabindex^="-"]):not([hidden]):not([disabled]), .ion-focusable[disabled="false"]:not([tabindex^="-"]):not([hidden])';

const entries = new Map<HTMLElement, OverlayEntry>();
let lastOverlayIndex = 0;

/** A new overlay index (z-index offset), like Ionic's `prepareOverlay`. */
export const nextOverlayIndex = (): number => ++lastOverlayIndex;

/** `ion-app`, or `body` when there is none: where Ionic (and the app overlays) mount overlays. */
export const getOverlayRoot = (): HTMLElement => document.querySelector('ion-app') ?? document.body;

const isIonicPresented = (el: Element): boolean =>
    ((el as HTMLElement & { overlayIndex?: number }).overlayIndex ?? 0) > 0 &&
    !el.classList.contains('overlay-hidden');

const isToast = (el: Element): boolean =>
    el.tagName === 'ION-TOAST' || entries.get(el as HTMLElement)?.kind === 'toast';

/** Every presented overlay, Ionic and app-owned, bottom to top. */
export const getPresentedOverlays = (): HTMLElement[] =>
    Array.from(
        document.querySelectorAll<HTMLElement>(`${IONIC_OVERLAYS},[${APP_OVERLAY_ATTR}]`)
    ).filter(el => (el.hasAttribute(APP_OVERLAY_ATTR) ? entries.has(el) : isIonicPresented(el)));

/** The top-most presented overlay of either kind (Ionic's `getPresentedOverlay`). */
export const getPresentedOverlay = (): HTMLElement | undefined => {
    const overlays = getPresentedOverlays();
    return overlays[overlays.length - 1];
};

/** The presented app overlay on top of every other overlay, if the top-most one is app-owned. */
const getTopAppOverlay = (): OverlayEntry | undefined => {
    const top = getPresentedOverlay();
    return top ? entries.get(top) : undefined;
};

/** Dismisses every presented app popover / loading (helpers/uiHelpers `closeAll`, which skips toasts). */
export const dismissAllAppOverlays = (): void => {
    for (const entry of Array.from(entries.values())) if (entry.kind !== 'toast') entry.dismiss();
};

const setRootAriaHidden = (hidden: boolean): void => {
    const viewContainer = getOverlayRoot().querySelector(
        'ion-router-outlet, ion-nav, #ion-view-container-root'
    );
    if (!viewContainer) return;
    if (hidden) viewContainer.setAttribute('aria-hidden', 'true');
    else viewContainer.removeAttribute('aria-hidden');
};

/** `newTop` is not registered yet, so its kind is passed in. */
const hideUnderlyingOverlaysFromScreenReaders = (
    newTop: HTMLElement,
    newTopKind: OverlayKind
): void => {
    const overlays = getPresentedOverlays();
    for (let i = overlays.length - 1; i >= 0; i--) {
        const next = overlays[i + 1] ?? newTop;
        const nextIsToast = overlays[i + 1] ? isToast(next) : newTopKind === 'toast';
        if (next.hasAttribute('aria-hidden') || !nextIsToast) {
            overlays[i].setAttribute('aria-hidden', 'true');
        }
    }
};

const revealOverlaysToScreenReaders = (): void => {
    const overlays = getPresentedOverlays();
    for (let i = overlays.length - 1; i >= 0; i--) {
        overlays[i].removeAttribute('aria-hidden');
        if (!isToast(overlays[i])) break;
    }
};

const isAndroid = (): boolean =>
    typeof navigator !== 'undefined' && /android|sink/i.test(navigator.userAgent);

/**
 * Start of `present()`: hides the page (non-toast overlays) and the overlays underneath, then
 * registers the overlay. Call before the enter animation.
 */
export const willPresentOverlay = (entry: OverlayEntry): void => {
    const { el, kind } = entry;
    if (kind !== 'toast') {
        setRootAriaHidden(true);
        document.body.classList.add(BACKDROP_NO_SCROLL);
    }
    hideUnderlyingOverlaysFromScreenReaders(el, kind);
    if (isAndroid()) el.setAttribute('aria-hidden', 'true');
    entries.set(el, entry);
    ensureListeners();
    syncIonicFocusTrap();
};

/**
 * End of `present()`, after the enter animation: arranges focus restoration (non-toasts), moves
 * focus into the overlay (`keyboardClose`) and exposes it to screen readers.
 * Returns the focus restore callback to run after `didDismiss`.
 */
export const didPresentOverlay = (entry: OverlayEntry, keyboardClose: boolean): (() => void) => {
    const { el, kind } = entry;
    let restore = (): void => undefined;
    if (kind !== 'toast') {
        let previous = document.activeElement as HTMLElement | null;
        const shadowTarget = previous?.shadowRoot?.querySelector<HTMLElement>(FOCUSABLE);
        if (shadowTarget) previous = shadowTarget;
        restore = () => {
            if (
                previous &&
                (document.activeElement === null || document.activeElement === document.body)
            ) {
                previous.focus();
            }
        };
    }
    if (
        keyboardClose &&
        (document.activeElement === null || !el.contains(document.activeElement))
    ) {
        el.focus();
    }
    el.removeAttribute('aria-hidden');
    return restore;
};

/**
 * Start of `dismiss()`: shows the page again when this is the last non-toast overlay, and
 * unregisters the overlay. Call before the leave animation.
 */
export const willDismissOverlay = (entry: OverlayEntry): void => {
    const { el } = entry;
    // `el` may already be out of the DOM (unmounted while presented): count the others.
    const otherNonToasts = getPresentedOverlays().filter(o => o !== el && !isToast(o));
    if (entry.kind !== 'toast' && otherNonToasts.length === 0) {
        setRootAriaHidden(false);
        document.body.classList.remove(BACKDROP_NO_SCROLL);
    }
    entries.delete(el);
    if (isAndroid()) el.setAttribute('aria-hidden', 'true');
    syncIonicFocusTrap();
};

/** End of `dismiss()`, once the overlay left the DOM: exposes the new top-most overlays. */
export const didDismissOverlay = (): void => {
    revealOverlaysToScreenReaders();
};

/**
 * While an app overlay is on top, the top-most Ionic non-toast overlay must not run Ionic's focus
 * trap (it would pull focus out of the app overlay). Ionic's own opt-out is this class.
 */
const syncIonicFocusTrap = (): void => {
    const overlays = getPresentedOverlays();
    const topIndex = lastNonToastIndex(overlays);
    const appTopIndex = topIndex >= 0 && entries.has(overlays[topIndex]) ? topIndex : -1;
    for (const el of Array.from(
        document.querySelectorAll<HTMLElement>(`[${FOCUS_TRAP_DISABLED_BY_APP}]`)
    )) {
        const index = overlays.indexOf(el);
        if (index >= 0 && index < appTopIndex) continue;
        el.classList.remove(FOCUS_TRAP_DISABLE_CLASS);
        el.removeAttribute(FOCUS_TRAP_DISABLED_BY_APP);
    }
    for (let i = 0; i < appTopIndex; i++) {
        const el = overlays[i];
        if (entries.has(el) || isToast(el) || el.classList.contains(FOCUS_TRAP_DISABLE_CLASS))
            continue;
        el.classList.add(FOCUS_TRAP_DISABLE_CLASS);
        el.setAttribute(FOCUS_TRAP_DISABLED_BY_APP, '');
    }
};

const lastNonToastIndex = (overlays: HTMLElement[]): number => {
    for (let i = overlays.length - 1; i >= 0; i--) if (!isToast(overlays[i])) return i;
    return -1;
};

const focusIn = (target: Element | null | undefined, fallback: HTMLElement): void => {
    const shadowTarget = (target as HTMLElement | null)?.shadowRoot?.querySelector<HTMLElement>(
        FOCUSABLE
    );
    const element = (shadowTarget ?? target) as HTMLElement | null;
    if (element) element.focus();
    else fallback.focus();
};

const focusFirstDescendant = (ref: Element, fallback: HTMLElement): void =>
    focusIn(ref.querySelector(FOCUSABLE), fallback);

const focusLastDescendant = (ref: Element, fallback: HTMLElement): void => {
    const all = ref.querySelectorAll(FOCUSABLE);
    focusIn(all.length > 0 ? all[all.length - 1] : null, fallback);
};

/** Ionic's `trapKeyboardFocus`, for an app overlay that is the top-most non-toast overlay. */
const onFocus = (ev: FocusEvent): void => {
    syncIonicFocusTrap();
    const overlays = getPresentedOverlays();
    const index = lastNonToastIndex(overlays);
    const entry = index >= 0 ? entries.get(overlays[index]) : undefined;
    const target = ev.target as Element | null;
    if (!entry || !target || !(target instanceof Element) || entry.trap === 'none') return;
    const { el } = entry;
    if (entry.trap === 'shadow') {
        if (el.contains(target)) {
            entry.lastFocus = target;
        } else if (isToast(target)) {
            focusIn(entry.lastFocus, el);
        } else {
            const lastFocus = entry.lastFocus;
            focusFirstDescendant(el, el);
            if (lastFocus === document.activeElement) focusLastDescendant(el, el);
            entry.lastFocus = document.activeElement;
        }
        return;
    }
    // Scoped (ion-loading): the host itself, the wrapper, or the tab sentinels.
    if (el === target) {
        entry.lastFocus = undefined;
    } else if (isToast(target)) {
        focusIn(entry.lastFocus, el);
    } else {
        if (!el.contains(target)) return;
        const wrapper = el.querySelector('.app-overlay-wrapper');
        if (!wrapper) return;
        if (wrapper.contains(target) || target === el.querySelector('.app-backdrop')) {
            entry.lastFocus = target;
        } else {
            const lastFocus = entry.lastFocus;
            focusFirstDescendant(wrapper, el);
            if (lastFocus === document.activeElement) focusLastDescendant(wrapper, el);
            entry.lastFocus = document.activeElement;
        }
    }
};

/**
 * Tab from the last focusable of a top-most app popover: Ionic's trap catches focus landing on the
 * next element and sends it to the first focusable. A portal at the end of the document has no
 * next element (focus would leave the page without a focus event), so wrap here instead.
 */
const wrapTabAtEnd = (ev: KeyboardEvent): void => {
    if (ev.shiftKey) return;
    const overlays = getPresentedOverlays();
    const index = lastNonToastIndex(overlays);
    const entry = index >= 0 ? entries.get(overlays[index]) : undefined;
    if (!entry || entry.trap !== 'shadow') return;
    const all = entry.el.querySelectorAll<HTMLElement>(FOCUSABLE);
    const last = all.length > 0 ? all[all.length - 1] : entry.el;
    if (document.activeElement !== last) return;
    ev.preventDefault();
    focusFirstDescendant(entry.el, entry.el);
    entry.lastFocus = document.activeElement;
};

/**
 * Escape while an app overlay is on top: dismiss it when it allows (`backdropDismiss`) and stop
 * Ionic's document listener from dismissing the Ionic overlay underneath. Registered at module
 * load, before Ionic registers its listener on the first Ionic overlay.
 */
const onKeyDown = (ev: KeyboardEvent): void => {
    if (ev.key === 'Tab') {
        wrapTabAtEnd(ev);
        return;
    }
    if (ev.key !== 'Escape') return;
    const entry = getTopAppOverlay();
    if (!entry) return;
    ev.stopImmediatePropagation();
    if (entry.backdropDismiss) entry.dismiss('backdrop');
};

type BackButtonEvent = CustomEvent<{ register: (priority: number, handler: () => void) => void }>;

const onBackButton = (ev: Event): void => {
    const entry = getTopAppOverlay();
    if (entry?.backdropDismiss) {
        (ev as BackButtonEvent).detail.register(APP_OVERLAY_BACK_BUTTON_PRIORITY, () =>
            entry.dismiss('backdrop')
        );
    }
};

let listening = false;
const ensureListeners = (): void => {
    if (listening || typeof document === 'undefined') return;
    listening = true;
    window.addEventListener('focus', onFocus, true);
    document.addEventListener('ionBackButton', onBackButton);
};

if (typeof document !== 'undefined') document.addEventListener('keydown', onKeyDown);

/** Test helper: forget every registered overlay. */
export const resetOverlayStackForTests = (): void => {
    entries.clear();
};
