/**
 * The overlay stack shared by the app-owned overlays (AppPopover, AppLoading, AppToast,
 * AppOverlayModal, AppAlert) and the Ionic overlays still in use (learn-card-base's ion-modal,
 * ...). Ports the parts of @ionic/core 8.7.2
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
 * - z-index: Ionic numbers its overlays from its own private counter (modal / alert / popover:
 *   20000 + index). An app modal or alert takes the next z-index above every presented overlay in
 *   its tier, and an Ionic overlay presented later is raised above the app overlays in its tier,
 *   so presentation order is stacking order for both kinds.
 */

export type OverlayKind = 'popover' | 'loading' | 'toast' | 'modal' | 'alert';

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
    /**
     * Where the `shadow` trap looks for focusable elements (default: `el`). ion-modal's trap only
     * saw its light DOM (the content), not the drag handle in its shadow root.
     */
    trapRoot?: HTMLElement;
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

/** Ionic's z-index tiers are 20000 wide (modal / alert / popover 20000, loading 40000, toast 60000). */
const Z_TIER = 20000;
const zIndexOf = (el: Element): number => Number(getComputedStyle(el).zIndex) || 0;
const tierOf = (z: number): number => Math.floor(z / Z_TIER) * Z_TIER;

/**
 * The z-index for an app overlay presenting now in the tier starting at `base`: above every
 * presented overlay (Ionic or app) in that tier, so the newest overlay is on top.
 */
export const nextStackZIndex = (base: number, self?: HTMLElement): number => {
    let z = base + nextOverlayIndex();
    for (const el of getPresentedOverlays()) {
        if (el === self) continue;
        const other = zIndexOf(el);
        if (tierOf(other) === base && other >= z) z = other + 1;
    }
    return z;
};

/** An Ionic overlay presenting after an app overlay of its tier must stack above it. */
const raiseIonicOverlay = (ev: Event): void => {
    const el = ev.target as HTMLElement | null;
    if (!el || !(el instanceof HTMLElement) || el.hasAttribute(APP_OVERLAY_ATTR)) return;
    const z = zIndexOf(el);
    let max = -1;
    for (const entry of Array.from(entries.values())) {
        const other = zIndexOf(entry.el);
        if (tierOf(other) === tierOf(z) && other > max) max = other;
    }
    if (max >= z) el.style.zIndex = String(max + 1);
};

const IONIC_WILL_PRESENT_EVENTS = [
    'ionModalWillPresent',
    'ionAlertWillPresent',
    'ionPopoverWillPresent',
    'ionActionSheetWillPresent',
    'ionLoadingWillPresent',
    'ionToastWillPresent',
];

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

/**
 * ion-datetime's `closeParentOverlay`: dismisses the closest modal or popover around `el`, whether
 * it is an Ionic one (`dismiss(undefined, role)`) or an app-owned one (the entry's `dismiss(role)`).
 * Returns whether one was found.
 */
export const dismissClosestModalOrPopover = (el: Element, role: OverlayRole): boolean => {
    let node: Element | null = el.closest(`ion-modal, ion-popover, [${APP_OVERLAY_ATTR}]`);
    while (node) {
        if (node.tagName === 'ION-MODAL' || node.tagName === 'ION-POPOVER') {
            void (
                node as HTMLElement & {
                    dismiss: (data?: unknown, role?: string) => Promise<boolean>;
                }
            ).dismiss(undefined, role);
            return true;
        }
        const entry = entries.get(node as HTMLElement);
        if (entry && (entry.kind === 'modal' || entry.kind === 'popover')) {
            entry.dismiss(role);
            return true;
        }
        node = node.parentElement?.closest(`ion-modal, ion-popover, [${APP_OVERLAY_ATTR}]`) ?? null;
    }
    return false;
};

/** Dismisses every presented app overlay but toasts (helpers/uiHelpers `closeAll`, which skips toasts). */
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

/** Ionic skips its trap for an overlay with the `ion-disable-focus-trap` class (`focusTrap: false`). */
const trapsFocus = (entry: OverlayEntry): boolean =>
    entry.trap !== 'none' && !entry.el.classList.contains(FOCUS_TRAP_DISABLE_CLASS);

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
    if (!entry || !target || !(target instanceof Element) || !trapsFocus(entry)) return;
    const { el } = entry;
    if (entry.trap === 'shadow') {
        const root = entry.trapRoot ?? el;
        if (el.contains(target)) {
            entry.lastFocus = target;
        } else if (isToast(target)) {
            focusIn(entry.lastFocus, el);
        } else {
            const lastFocus = entry.lastFocus;
            focusFirstDescendant(root, el);
            if (lastFocus === document.activeElement) focusLastDescendant(root, el);
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
    if (!entry || entry.trap !== 'shadow' || !trapsFocus(entry)) return;
    // ion-modal's trap had the same gap and left it open: Tab from its last control leaves the page.
    if (entry.kind === 'modal') return;
    const root = entry.trapRoot ?? entry.el;
    const all = root.querySelectorAll<HTMLElement>(FOCUSABLE);
    const last = all.length > 0 ? all[all.length - 1] : entry.el;
    if (document.activeElement !== last) return;
    ev.preventDefault();
    focusFirstDescendant(root, entry.el);
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

if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeyDown);
    for (const name of IONIC_WILL_PRESENT_EVENTS)
        document.addEventListener(name, raiseIonicOverlay);
}

/** Test helper: forget every registered overlay. */
export const resetOverlayStackForTests = (): void => {
    entries.clear();
};
