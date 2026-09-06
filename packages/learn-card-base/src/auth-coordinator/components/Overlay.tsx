/**
 * Fullscreen overlay backdrop used for recovery, error, and migration modals.
 */

import React, { useCallback, useEffect, useRef } from 'react';

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

    return (
        <div className="lc-auth-overlay fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-black/50 backdrop-blur-sm animate-fade-in-up font-poppins sm:p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Dialog')}
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
                tabIndex={-1}
                className="lc-surface bg-white sm:rounded-[20px] shadow-2xl sm:max-w-[480px] w-full min-h-full sm:min-h-0 mx-auto sm:my-auto shrink-0 focus:outline-none"
            >
                {children}
            </div>
        </div>
    );
};
