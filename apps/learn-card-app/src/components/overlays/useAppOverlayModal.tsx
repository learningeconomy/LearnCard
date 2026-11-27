import React, { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import {
    AppOverlayModal,
    type AppOverlayModalHandle,
    type AppOverlayModalProps,
} from './AppOverlayModal';
import { hasAppOverlayManager, removeManagedOverlay, setManagedOverlay } from './AppOverlayManager';
import type { OverlayRole } from './overlayStack';

export type AppOverlayModalOptions = Omit<AppOverlayModalProps, 'isOpen' | 'children'>;

/**
 * As loose as `useIonModal`'s `ReactComponentOrElement` / `componentProps?: any`: the hook is a
 * drop-in swap, and typing the props would surface existing call-site prop mismatches.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- useIonModal's untyped component props
type ModalComponent = React.JSXElementConstructor<any> | React.ReactElement;

let lastModalId = 0;

/**
 * `useIonModal` for AppOverlayModal: `present(options)` opens `component` (with `componentProps`)
 * in a modal, `dismiss(data, role)` closes it. As with Ionic React:
 * - the content renders through `AppOverlayManager` (IonApp's overlay manager), not the caller's
 *   tree, inside a `div.ion-page`, and re-renders when `componentProps` changes identity;
 * - a `present` while the modal is up is ignored, and the modal outlives the caller's unmount;
 * - without a mounted manager the content renders in a detached root (no app context).
 */
export const useAppOverlayModal = (
    component: ModalComponent,
    componentProps?: object
): [
    (options?: AppOverlayModalOptions) => void,
    (data?: unknown, role?: OverlayRole) => Promise<void>,
] => {
    const [overlayId] = useState(() => `app-modal-${++lastModalId}`);
    const [options, setOptions] = useState<AppOverlayModalOptions | null>(null);
    const state = useRef<{ open: boolean; handle: AppOverlayModalHandle | null; root?: Root }>({
        open: false,
        handle: null,
    });

    useEffect(() => {
        if (!options) return;
        const s = state.current;
        const content = React.isValidElement(component)
            ? component
            : createElement(component, componentProps);
        const onDidDismiss: AppOverlayModalProps['onDidDismiss'] = event => {
            options.onDidDismiss?.(event);
            s.open = false;
            s.handle = null;
            // After AppOverlayModal's own dismiss bookkeeping, as Ionic removed it after the event.
            setTimeout(() => {
                setOptions(current => (current === options ? null : current));
                removeManagedOverlay(overlayId);
                s.root?.unmount();
                s.root = undefined;
            }, 0);
        };
        const node = (
            <AppOverlayModal
                {...options}
                ref={handle => {
                    if (handle) s.handle = handle;
                }}
                isOpen
                onDidDismiss={onDidDismiss}
            >
                <div className="ion-page">{content}</div>
            </AppOverlayModal>
        );
        if (hasAppOverlayManager()) {
            setManagedOverlay(overlayId, node);
        } else {
            if (!s.root) s.root = createRoot(document.createElement('div'));
            s.root.render(node);
        }
    }, [component, componentProps, options, overlayId]);

    const present = useCallback((presentOptions: AppOverlayModalOptions = {}) => {
        if (state.current.open) return;
        state.current.open = true;
        setOptions(presentOptions);
    }, []);

    const dismiss = useCallback(async (data?: unknown, role?: OverlayRole) => {
        await state.current.handle?.dismiss(data, role);
    }, []);

    return [present, dismiss];
};

export default useAppOverlayModal;
