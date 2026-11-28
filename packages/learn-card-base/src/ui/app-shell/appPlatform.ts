/**
 * The document setup `setupIonicReact()` / `ion-app` did, ported from @ionic/core 8.7.2
 * (ionic-global.js, focus-visible.js and the class half of tap-click, MIT License, Copyright (c)
 * Ionic). LearnCard's components read these:
 *
 * - `<html mode="ios|md">` plus the `ios` / `md` class: `getIonMode()` and the mode-specific CSS.
 * - `plt-*` classes on `<html>` (`plt-ios`, `plt-android`, `plt-mobile`, `plt-hybrid`, ...).
 * - `ion-focused` on keyboard-focused `.ion-focusable` elements (alert buttons, tab buttons).
 * - `ion-activated` on pressed `.ion-activatable` elements (alert buttons). Ripples are drawn by
 *   `AppRippleEffect`, so the tap-click ripple half is not ported.
 *
 * Not ported, because nothing in LearnCard used them once the Ionic components were gone: the
 * hardware back button (it needs an `App` `backButton` listener, which LearnCard never added),
 * the status-bar tap (it scrolls `ion-content` elements), input shims (`ion-input` only) and the
 * keyboard assist events (`keyboardVisibility` listens to Capacitor directly).
 */
import type { IonMode } from './ionMode';

type Win = Window & {
    cordova?: unknown;
    phonegap?: unknown;
    PhoneGap?: unknown;
    Capacitor?: { isNative?: boolean; isNativePlatform?: () => boolean };
    navigator: Navigator & { standalone?: boolean };
};

const testUserAgent = (win: Win, expr: RegExp): boolean => expr.test(win.navigator.userAgent);
const matchMedia = (win: Win, query: string): boolean => !!win.matchMedia?.(query).matches;

const isMobile = (win: Win): boolean => matchMedia(win, '(any-pointer:coarse)');
const isIpad = (win: Win): boolean =>
    testUserAgent(win, /iPad/i) || (testUserAgent(win, /Macintosh/i) && isMobile(win));
const isIphone = (win: Win): boolean => testUserAgent(win, /iPhone/i);
const isIOS = (win: Win): boolean => testUserAgent(win, /iPhone|iPod/i) || isIpad(win);
const isAndroid = (win: Win): boolean => testUserAgent(win, /android|sink/i);
const isAndroidTablet = (win: Win): boolean => isAndroid(win) && !testUserAgent(win, /mobile/i);
const screenSides = (win: Win): [number, number] => {
    const { innerWidth: width, innerHeight: height } = win;
    return [Math.min(width, height), Math.max(width, height)];
};
const isPhablet = (win: Win): boolean => {
    const [smallest, largest] = screenSides(win);
    return smallest > 390 && smallest < 520 && largest > 620 && largest < 800;
};
const isTablet = (win: Win): boolean => {
    const [smallest, largest] = screenSides(win);
    return (
        isIpad(win) ||
        isAndroidTablet(win) ||
        (smallest > 460 && smallest < 820 && largest > 780 && largest < 1400)
    );
};
const isCordova = (win: Win): boolean => !!(win.cordova || win.phonegap || win.PhoneGap);
const isCapacitorNative = (win: Win): boolean =>
    !!(win.Capacitor?.isNative || win.Capacitor?.isNativePlatform?.());
const isHybrid = (win: Win): boolean => isCordova(win) || isCapacitorNative(win);
const isPWA = (win: Win): boolean =>
    matchMedia(win, '(display-mode: standalone)') || !!win.navigator.standalone;

const PLATFORMS_MAP = {
    ipad: isIpad,
    iphone: isIphone,
    ios: isIOS,
    android: isAndroid,
    phablet: isPhablet,
    tablet: isTablet,
    cordova: isCordova,
    capacitor: isCapacitorNative,
    electron: (win: Win) => testUserAgent(win, /electron/i),
    pwa: isPWA,
    mobile: isMobile,
    mobileweb: (win: Win) => isMobile(win) && !isHybrid(win),
    desktop: (win: Win) => !isMobile(win),
    hybrid: isHybrid,
} as const;

export type AppPlatform = keyof typeof PLATFORMS_MAP;

let platforms: AppPlatform[] | undefined;

/** Ionic's `getPlatforms()`: detected once, and written to `<html>` as `plt-*` classes. */
export const getPlatforms = (): AppPlatform[] => {
    if (typeof window === 'undefined') return [];
    if (!platforms) {
        const win = window as Win;
        platforms = (Object.keys(PLATFORMS_MAP) as AppPlatform[]).filter(p =>
            PLATFORMS_MAP[p](win)
        );
        platforms.forEach(p => document.documentElement.classList.add(`plt-${p}`));
    }
    return platforms;
};

/** Ionic's `isPlatform(name)`. */
export const isPlatform = (platform: AppPlatform): boolean => getPlatforms().includes(platform);

/** Ionic's `?ionic:mode=ios` URL override (configFromURL), used by tests and QA links. */
const modeFromUrl = (): IonMode | undefined => {
    try {
        const value = new URLSearchParams(window.location.search).get('ionic:mode');
        return value === 'ios' || value === 'md' ? value : undefined;
    } catch {
        return undefined;
    }
};

const FOCUS_KEYS = [
    'Tab',
    'ArrowDown',
    'Space',
    'Escape',
    ' ',
    'Shift',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'Home',
    'End',
];

/** Ionic's `startFocusVisible()`: `ion-focused` on keyboard-focused `.ion-focusable` elements. */
const startFocusVisible = (): void => {
    let currentFocus: Element[] = [];
    let keyboardMode = true;
    const setFocus = (elements: Element[]): void => {
        currentFocus.forEach(el => el.classList.remove('ion-focused'));
        elements.forEach(el => el.classList.add('ion-focused'));
        currentFocus = elements;
    };
    const pointerDown = (): void => {
        keyboardMode = false;
        setFocus([]);
    };
    document.addEventListener('keydown', ev => {
        keyboardMode = FOCUS_KEYS.includes(ev.key);
        if (!keyboardMode) setFocus([]);
    });
    document.addEventListener('focusin', ev => {
        if (!keyboardMode) return;
        setFocus(
            ev
                .composedPath()
                .filter(
                    (el): el is Element =>
                        el instanceof Element && el.classList.contains('ion-focusable')
                )
        );
    });
    document.addEventListener('focusout', () => {
        if (document.activeElement === document.body) setFocus([]);
    });
    document.addEventListener('touchstart', pointerDown, { passive: true });
    document.addEventListener('mousedown', pointerDown);
};

const ACTIVATED = 'ion-activated';
const ADD_ACTIVATED_DEFERS = 100;
const CLEAR_STATE_DEFERS = 150;

/** Ionic's `startTapClick()`, without the ripple: `ion-activated` on pressed `.ion-activatable`s. */
const startTapClick = (): void => {
    let lastActivated = 0;
    let activatableEle: HTMLElement | undefined;
    let activeDefer: ReturnType<typeof setTimeout> | undefined;
    const clearDefers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();
    const isInstant = (el: HTMLElement): boolean =>
        el.classList.contains('ion-activatable-instant');

    const addActivated = (el: HTMLElement): void => {
        lastActivated = Date.now();
        el.classList.add(ACTIVATED);
    };
    const removeActivated = (smooth: boolean): void => {
        const active = activatableEle;
        if (!active) return;
        const time = CLEAR_STATE_DEFERS - Date.now() + lastActivated;
        if (smooth && time > 0 && !isInstant(active)) {
            const deferId = setTimeout(() => {
                active.classList.remove(ACTIVATED);
                clearDefers.delete(active);
            }, CLEAR_STATE_DEFERS);
            clearDefers.set(active, deferId);
        } else {
            active.classList.remove(ACTIVATED);
        }
    };
    const cancelActive = (): void => {
        if (activeDefer) clearTimeout(activeDefer);
        activeDefer = undefined;
        if (activatableEle) {
            removeActivated(false);
            activatableEle = undefined;
        }
    };
    const setActivatedElement = (el: HTMLElement | undefined): void => {
        if (el && el === activatableEle) return;
        if (activeDefer) clearTimeout(activeDefer);
        activeDefer = undefined;
        if (activatableEle) {
            if (!activatableEle.classList.contains(ACTIVATED)) addActivated(activatableEle);
            removeActivated(true);
        }
        if (el) {
            const deferId = clearDefers.get(el);
            if (deferId) {
                clearTimeout(deferId);
                clearDefers.delete(el);
            }
            el.classList.remove(ACTIVATED);
            const callback = (): void => {
                addActivated(el);
                activeDefer = undefined;
            };
            if (isInstant(el)) callback();
            else activeDefer = setTimeout(callback, ADD_ACTIVATED_DEFERS);
        }
        activatableEle = el;
    };
    const getActivatableTarget = (ev: PointerEvent): HTMLElement | undefined => {
        const path = ev.composedPath();
        for (let i = 0; i < path.length - 2; i++) {
            const el = path[i];
            if (el instanceof HTMLElement && el.classList.contains('ion-activatable')) return el;
        }
        return undefined;
    };

    document.addEventListener(
        'pointerdown',
        ev => {
            if (activatableEle || ev.button === 2) return;
            setActivatedElement(getActivatableTarget(ev));
        },
        true
    );
    document.addEventListener('pointerup', () => setActivatedElement(undefined), true);
    document.addEventListener('pointercancel', cancelActive, true);
};

let initialized = false;

/**
 * Replaces `setupIonicReact()`: picks the mode like Ionic's config (`config.mode`, else
 * `?ionic:mode=`, else a pre-set `<html mode>`, else `ios` on iOS and `md` elsewhere), writes it
 * and the `plt-*` classes to `<html>`, and starts focus-visible and tap activation. Safe to call
 * more than once; later calls return the first mode.
 */
export const initAppPlatform = (config: { mode?: IonMode } = {}): IonMode => {
    const root = document.documentElement;
    const preset = root.getAttribute('mode');
    if (initialized) return preset === 'ios' ? 'ios' : 'md';
    const mode: IonMode =
        config.mode ??
        modeFromUrl() ??
        (preset === 'ios' || preset === 'md' ? preset : isPlatform('ios') ? 'ios' : 'md');
    initialized = true;
    getPlatforms();
    root.setAttribute('mode', mode);
    root.classList.add(mode);
    startFocusVisible();
    startTapClick();
    return mode;
};
