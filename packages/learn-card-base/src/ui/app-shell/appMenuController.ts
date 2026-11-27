import { useSyncExternalStore } from 'react';

/** Snapshot of the app's side menu, as published by the mounted `AppMenu`. */
export type AppMenuState = {
    /** An `AppMenu` is mounted (the logged-in side menu). */
    registered: boolean;
    /** The mounted menu's `disabled` prop. */
    disabled: boolean;
    /** The menu is docked in the split pane (wide viewport), so it can't open or close. */
    isPaneVisible: boolean;
    /** The overlay drawer is open (or animating open). */
    isOpen: boolean;
};

export type AppMenuApi = AppMenuState & {
    /** `registered && !disabled && !isPaneVisible` — the same rule as Ionic's `menu.isActive()`. */
    isActive: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
};

/** What `AppMenu` registers so toggles anywhere in the tree can drive it. */
export type AppMenuHandle = {
    menuId?: string;
    setOpen: (shouldOpen: boolean) => void;
};

const CLOSED_STATE: AppMenuState = {
    registered: false,
    disabled: false,
    isPaneVisible: false,
    isOpen: false,
};

let state: AppMenuState = CLOSED_STATE;
let handle: AppMenuHandle | null = null;
const listeners = new Set<() => void>();

const emit = (): void => listeners.forEach(listener => listener());

const isActive = (snapshot: AppMenuState): boolean =>
    snapshot.registered && !snapshot.disabled && !snapshot.isPaneVisible;

/**
 * Resolves a toggle's `menu` prop the way Ionic's `menuController.get()` did for this app's single
 * menu: a matching id, or no id at all, reaches the mounted menu; any other id reaches nothing.
 */
const resolve = (menu?: string): AppMenuHandle | null => {
    if (!handle) return null;
    if (menu === undefined || menu === 'start' || menu === handle.menuId) return handle;
    return null;
};

/**
 * Module-level controller for the side menu, mirroring Ionic's global `menuController`: a toggle
 * rendered anywhere (including portal-rendered modals outside the split pane) reaches the menu.
 */
export const appMenuController = {
    getState: (): AppMenuState => state,
    isActive: (): boolean => isActive(state),
    subscribe: (listener: () => void): (() => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    register: (menu: AppMenuHandle, initial: Omit<AppMenuState, 'registered'>): void => {
        handle = menu;
        state = { ...initial, registered: true };
        emit();
    },
    unregister: (menu: AppMenuHandle): void => {
        if (handle !== menu) return;
        handle = null;
        state = CLOSED_STATE;
        emit();
    },
    update: (menu: AppMenuHandle, patch: Partial<Omit<AppMenuState, 'registered'>>): void => {
        if (handle !== menu) return;
        const next = { ...state, ...patch };
        if (
            next.disabled === state.disabled &&
            next.isPaneVisible === state.isPaneVisible &&
            next.isOpen === state.isOpen
        ) {
            return;
        }
        state = next;
        emit();
    },
    open: (menu?: string): void => resolve(menu)?.setOpen(true),
    close: (menu?: string): void => resolve(menu)?.setOpen(false),
    toggle: (menu?: string): void => {
        const target = resolve(menu);
        target?.setOpen(!state.isOpen);
    },
};

/** Reads the side menu state and its open/close/toggle actions. */
export const useAppMenu = (menu?: string): AppMenuApi => {
    const snapshot = useSyncExternalStore(
        appMenuController.subscribe,
        appMenuController.getState,
        appMenuController.getState
    );
    const reachable = snapshot.registered && (menu === undefined || resolve(menu) !== null);

    return {
        ...snapshot,
        isActive: reachable && isActive(snapshot),
        open: () => appMenuController.open(menu),
        close: () => appMenuController.close(menu),
        toggle: () => appMenuController.toggle(menu),
    };
};
