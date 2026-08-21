import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useModalActionsContext, useModalsContext } from 'learn-card-base';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

const isVisible = (element: HTMLElement): boolean =>
    element.getClientRects().length > 0 &&
    element.getAttribute('aria-hidden') !== 'true' &&
    !element.closest('[aria-hidden="true"]');

const getFocusableElements = (dialog: HTMLElement): HTMLElement[] =>
    Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        element => isVisible(element) && !element.className.includes('dimmer')
    );

const getModalDom = (): {
    appRouter: HTMLElement | null;
    portal: HTMLElement | null;
    topOpenContainer: HTMLElement | null;
} => {
    const appRouter = document.getElementById('app-router');
    const portal = document.getElementById('modal-mid-root');
    const openContainers = portal
        ? Array.from(portal.children).filter(
              (element): element is HTMLElement =>
                  element instanceof HTMLElement && element.classList.contains('open')
          )
        : [];

    return { appRouter, portal, topOpenContainer: openContainers.at(-1) ?? null };
};

/**
 * Adds accessible behavior to the app's existing shared modal portal without
 * changing the shared modal implementation. This can be removed when the base
 * modal shells provide the same dialog contract themselves.
 */
const ModalAccessibilityManager: React.FC = () => {
    const { modals } = useModalsContext();
    const { requestCloseModal } = useModalActionsContext();
    const returnFocusByModalIdRef = useRef(new Map<number, HTMLElement | null>());
    const activeModalIdRef = useRef<number | null>(null);
    const activeDialogRef = useRef<HTMLElement | null>(null);
    const [domRevision, setDomRevision] = useState(0);

    const openModals = modals.filter(modal => modal.open);
    const topModal = openModals.at(-1);
    const openModalIds = openModals.map(modal => modal.id).join(',');

    // Modal containers can be replaced without a modal-context update when the
    // responsive shell changes, and #app-router is remounted during auth setup.
    // Reconcile those identity changes so the live DOM always gets modality,
    // labeling, focus trapping, and background isolation.
    useEffect(() => {
        let previousDom = getModalDom();
        const observer = new MutationObserver(() => {
            const nextDom = getModalDom();
            const hasIdentityChange =
                nextDom.appRouter !== previousDom.appRouter ||
                nextDom.portal !== previousDom.portal ||
                nextDom.topOpenContainer !== previousDom.topOpenContainer;

            previousDom = nextDom;
            if (hasIdentityChange) setDomRevision(revision => revision + 1);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => observer.disconnect();
    }, []);

    useLayoutEffect(() => {
        const { portal, appRouter, topOpenContainer } = getModalDom();
        const portalChildren = portal
            ? Array.from(portal.children).filter(
                  (element): element is HTMLElement => element instanceof HTMLElement
              )
            : [];
        const dialog = topOpenContainer;
        const previousModalId = activeModalIdRef.current;
        const openModalIdsSet = new Set(openModals.map(modal => modal.id));

        if (!topModal) {
            activeDialogRef.current = null;
            activeModalIdRef.current = null;
            appRouter?.removeAttribute('inert');
            appRouter?.removeAttribute('aria-hidden');

            portalChildren.forEach(container => {
                container.setAttribute('inert', '');
                container.setAttribute('aria-hidden', 'true');
            });

            const returnTargets = Array.from(returnFocusByModalIdRef.current.values());
            const returnTarget =
                returnTargets.find(
                    target => target?.isConnected && (!portal || !portal.contains(target))
                ) ?? returnTargets.find(target => target?.isConnected);
            returnFocusByModalIdRef.current.clear();

            if (returnTarget?.isConnected) {
                requestAnimationFrame(() => returnTarget.focus());
            }

            return undefined;
        }

        if (!dialog) {
            appRouter?.setAttribute('inert', '');
            appRouter?.setAttribute('aria-hidden', 'true');
            return undefined;
        }

        // A dialog returning to the top of a nested stack may still be inert
        // from the previous render. Re-enable it before restoring its trigger.
        dialog.removeAttribute('aria-hidden');
        dialog.removeAttribute('inert');

        if (previousModalId !== topModal.id) {
            if (previousModalId !== null && !openModalIdsSet.has(previousModalId)) {
                const nestedReturnTarget = returnFocusByModalIdRef.current.get(previousModalId);
                returnFocusByModalIdRef.current.delete(previousModalId);

                if (nestedReturnTarget?.isConnected) {
                    nestedReturnTarget.focus();
                }
            }

            if (!returnFocusByModalIdRef.current.has(topModal.id)) {
                returnFocusByModalIdRef.current.set(
                    topModal.id,
                    document.activeElement instanceof HTMLElement ? document.activeElement : null
                );
            }

            activeModalIdRef.current = topModal.id;
        }

        activeDialogRef.current = dialog;

        for (const container of portalChildren) {
            const isTopDialog = container === dialog;
            if (isTopDialog) {
                container.removeAttribute('aria-hidden');
                container.removeAttribute('inert');
            } else {
                container.setAttribute('aria-hidden', 'true');
                container.setAttribute('inert', '');
            }
        }

        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('tabindex', '-1');

        dialog.querySelectorAll<HTMLElement>('[class*="dimmer"]').forEach(dimmer => {
            dimmer.setAttribute('tabindex', '-1');
            dimmer.removeAttribute('aria-hidden');
            dimmer.setAttribute('aria-label', 'Close dialog');
        });

        const updateDialogName = (): void => {
            const title = dialog.querySelector<HTMLElement>(
                'h1, h2, h3, [role="heading"][aria-level]'
            );

            if (title) {
                const titleId = title.id || `app-dialog-title-${topModal.id}`;
                if (!title.id) title.id = titleId;
                dialog.setAttribute('aria-labelledby', titleId);
                dialog.removeAttribute('aria-label');
            } else {
                dialog.removeAttribute('aria-labelledby');
                dialog.setAttribute('aria-label', 'Dialog');
            }

            if (!dialog.contains(document.activeElement)) {
                (getFocusableElements(dialog)[0] ?? dialog).focus();
            }
        };

        updateDialogName();
        appRouter?.setAttribute('inert', '');
        appRouter?.setAttribute('aria-hidden', 'true');

        const observer = new MutationObserver(updateDialogName);
        observer.observe(dialog, { childList: true, subtree: true });

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (activeDialogRef.current !== dialog) return;

            if (event.key === 'Escape' && !topModal.options?.disableCloseHandlers) {
                event.preventDefault();
                void requestCloseModal();
                return;
            }

            if (event.key !== 'Tab') return;

            const focusableElements = getFocusableElements(dialog);
            if (focusableElements.length === 0) {
                event.preventDefault();
                dialog.focus();
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            const activeElement = document.activeElement;

            if (event.shiftKey && (activeElement === firstElement || activeElement === dialog)) {
                event.preventDefault();
                lastElement.focus();
            } else if (!event.shiftKey && activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            observer.disconnect();
            document.removeEventListener('keydown', handleKeyDown);
            dialog.removeAttribute('role');
            dialog.removeAttribute('aria-modal');
            dialog.removeAttribute('aria-labelledby');
            dialog.removeAttribute('aria-label');
            dialog.removeAttribute('tabindex');
        };
    }, [domRevision, openModalIds, requestCloseModal, topModal]);

    return null;
};

export default ModalAccessibilityManager;
