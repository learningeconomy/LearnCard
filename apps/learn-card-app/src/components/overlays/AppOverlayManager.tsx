import React, { useLayoutEffect, useSyncExternalStore } from 'react';

type ManagedOverlay = { id: string; node: React.ReactNode };

let overlays: ManagedOverlay[] = [];
let mountedManagers = 0;
const listeners = new Set<() => void>();

const emit = (): void => listeners.forEach(listener => listener());
const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const getSnapshot = (): ManagedOverlay[] => overlays;

/** Whether an `AppOverlayManager` is mounted to render hook overlays. */
export const hasAppOverlayManager = (): boolean => mountedManagers > 0;

/** Adds or replaces (same `id`, no remount) an overlay rendered by `AppOverlayManager`. */
export const setManagedOverlay = (id: string, node: React.ReactNode): void => {
    const index = overlays.findIndex(overlay => overlay.id === id);
    overlays =
        index === -1
            ? [...overlays, { id, node }]
            : overlays.map(overlay => (overlay.id === id ? { id, node } : overlay));
    emit();
};

export const removeManagedOverlay = (id: string): void => {
    if (!overlays.some(overlay => overlay.id === id)) return;
    overlays = overlays.filter(overlay => overlay.id !== id);
    emit();
};

/**
 * Renders the overlays opened with `useAppOverlayModal`, as IonApp's `IonOverlayManager` rendered
 * `useIonModal` content: mounted inside `IonApp` after the routes, so the modal content sees the
 * providers around the app (router, query client, auth, modals) but not the caller's own context.
 */
export const AppOverlayManager: React.FC = () => {
    const managed = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    useLayoutEffect(() => {
        mountedManagers += 1;
        return () => {
            mountedManagers -= 1;
        };
    }, []);
    return (
        <>
            {managed.map(overlay => (
                <React.Fragment key={overlay.id}>{overlay.node}</React.Fragment>
            ))}
        </>
    );
};

/** Test helper: forget every managed overlay. */
export const resetManagedOverlaysForTests = (): void => {
    overlays = [];
    emit();
};

export default AppOverlayManager;
