/**
 * Fullscreen overlay backdrop used for recovery, error, and migration modals.
 */

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'ion-input:not([disabled])',
    'ion-textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

type OverlayProps = React.PropsWithChildren<
    Pick<React.AriaAttributes, 'aria-label' | 'aria-labelledby' | 'aria-describedby'> & {
        onDismiss?: () => void;
    }
>;

const getFocusableElements = (container: HTMLElement): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        element => !element.hidden && element.getAttribute('aria-hidden') !== 'true'
    );

export const Overlay: React.FC<OverlayProps> = ({
    children,
    onDismiss,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
}) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const generatedTitleId = useId();
    const [derivedTitleId, setDerivedTitleId] = useState<string>();
    const generatedTitleElementRef = useRef<HTMLElement | null>(null);

    const clearGeneratedTitleId = useCallback((): void => {
        const generatedTitle = generatedTitleElementRef.current;

        if (generatedTitle?.id === `lc-overlay-title-${generatedTitleId}`) {
            generatedTitle.removeAttribute('id');
        }

        generatedTitleElementRef.current = null;
    }, [generatedTitleId]);

    const updateDerivedTitle = useCallback(
        (dialog: HTMLDivElement): void => {
            if (ariaLabelledBy || ariaLabel) {
                clearGeneratedTitleId();
                setDerivedTitleId(undefined);
                return;
            }

            const title = dialog.querySelector<HTMLElement>(
                'h1, h2, h3, [role="heading"][aria-level]'
            );

            if (!title) {
                clearGeneratedTitleId();
                setDerivedTitleId(undefined);
                return;
            }

            if (generatedTitleElementRef.current !== title) clearGeneratedTitleId();

            const titleId = title.id || `lc-overlay-title-${generatedTitleId}`;
            if (!title.id) {
                title.id = titleId;
                generatedTitleElementRef.current = title;
            }
            setDerivedTitleId(currentTitleId =>
                currentTitleId === titleId ? currentTitleId : titleId
            );
        },
        [ariaLabel, ariaLabelledBy, clearGeneratedTitleId, generatedTitleId]
    );

    const handleDialogRef = useCallback(
        (dialog: HTMLDivElement | null): void => {
            dialogRef.current = dialog;
            if (dialog) updateDerivedTitle(dialog);
        },
        [updateDerivedTitle]
    );

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog || ariaLabelledBy || ariaLabel) return;

        const observer = new MutationObserver(() => updateDerivedTitle(dialog));
        observer.observe(dialog, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [ariaLabel, ariaLabelledBy, updateDerivedTitle]);

    useEffect(() => {
        const previouslyFocused =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const frame = window.requestAnimationFrame(() => {
            const dialog = dialogRef.current;
            if (!dialog || dialog.contains(document.activeElement)) return;

            (getFocusableElements(dialog)[0] ?? dialog).focus();
        });

        return () => {
            window.cancelAnimationFrame(frame);
            if (previouslyFocused?.isConnected) previouslyFocused.focus();
        };
    }, []);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent): void => {
            const dialog = dialogRef.current;
            if (!dialog) return;

            const openOverlays = document.querySelectorAll('.lc-auth-overlay');
            if (dialog.parentElement !== openOverlays.item(openOverlays.length - 1)) return;

            const sharedModalPortal = document.getElementById('modal-mid-root');
            if (sharedModalPortal?.contains(document.activeElement)) return;

            if (event.key === 'Escape' && onDismiss) {
                event.preventDefault();
                event.stopImmediatePropagation();
                onDismiss();
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
            const focusIsOutside = !dialog.contains(document.activeElement);

            if (focusIsOutside || (event.shiftKey && document.activeElement === firstElement)) {
                event.preventDefault();
                (event.shiftKey ? lastElement : firstElement).focus();
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement.focus();
            }
        },
        [onDismiss]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown, true);
        return () => document.removeEventListener('keydown', handleKeyDown, true);
    }, [handleKeyDown]);

    const resolvedAriaLabelledBy = ariaLabelledBy ?? (ariaLabel ? undefined : derivedTitleId);
    const resolvedAriaLabel = ariaLabelledBy
        ? undefined
        : (ariaLabel ?? (derivedTitleId ? undefined : 'Dialog'));

    return (
        <div className="lc-auth-overlay fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-black/50 backdrop-blur-sm animate-fade-in-up font-poppins sm:p-4">
            <div
                ref={handleDialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={resolvedAriaLabel}
                aria-labelledby={resolvedAriaLabelledBy}
                aria-describedby={ariaDescribedBy}
                tabIndex={-1}
                className="lc-surface bg-white sm:rounded-[20px] shadow-2xl sm:max-w-[480px] w-full min-h-full sm:min-h-0 mx-auto sm:my-auto shrink-0 focus:outline-none"
            >
                {children}
            </div>
        </div>
    );
};
