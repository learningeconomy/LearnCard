import React, { useLayoutEffect, useRef } from 'react';

type AccessibleCredentialCardProps = React.PropsWithChildren<{
    label: string;
}>;

const CARD_SELECTOR = '[role="button"]';
const INTERACTIVE_DESCENDANT_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[contenteditable="true"]',
    '[tabindex]:not([tabindex="-1"])',
    '[role="button"]',
].join(',');

type EnhancedCard = {
    handler: (event: KeyboardEvent) => void;
    previousTabIndex: string | null;
    previousAriaLabel: string | null;
};

type DemotedCard = {
    previousRole: string | null;
    previousTabIndex: string | null;
    previousAriaLabel: string | null;
};

/**
 * Supplies the keyboard contract missing from shared credential renderers while
 * keeping this rollout app-local. The shared package can absorb this behavior
 * in the follow-up accessibility work.
 */
const AccessibleCredentialCard: React.FC<AccessibleCredentialCardProps> = ({ children, label }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const primaryCardRef = useRef<HTMLElement | null>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const enhancedCards = new Map<HTMLElement, EnhancedCard>();
        const demotedCards = new Map<HTMLElement, DemotedCard>();

        const restoreEnhancedCard = (card: HTMLElement): void => {
            const enhancedCard = enhancedCards.get(card);
            if (!enhancedCard) return;

            card.removeEventListener('keydown', enhancedCard.handler);

            if (enhancedCard.previousTabIndex === null) card.removeAttribute('tabindex');
            else card.setAttribute('tabindex', enhancedCard.previousTabIndex);

            if (enhancedCard.previousAriaLabel === null) card.removeAttribute('aria-label');
            else card.setAttribute('aria-label', enhancedCard.previousAriaLabel);

            enhancedCards.delete(card);
        };

        const enhanceCards = (): void => {
            if (!primaryCardRef.current?.isConnected) {
                primaryCardRef.current = container.querySelector<HTMLElement>(CARD_SELECTOR);
            }

            const primaryCard = primaryCardRef.current;

            // A clickable card cannot also contain focusable controls. Keep the
            // card's label as a group and let its buttons own keyboard focus.
            // Cards without interactive descendants retain their click +
            // Enter/Space behavior below.
            if (
                primaryCard &&
                !demotedCards.has(primaryCard) &&
                primaryCard.querySelector(INTERACTIVE_DESCENDANT_SELECTOR)
            ) {
                restoreEnhancedCard(primaryCard);
                demotedCards.set(primaryCard, {
                    previousRole: primaryCard.getAttribute('role'),
                    previousTabIndex: primaryCard.getAttribute('tabindex'),
                    previousAriaLabel: primaryCard.getAttribute('aria-label'),
                });
                primaryCard.setAttribute('role', 'group');
                primaryCard.removeAttribute('tabindex');
                primaryCard.setAttribute('aria-label', label);
            }

            container.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach(card => {
                if (enhancedCards.has(card)) return;

                const previousTabIndex = card.getAttribute('tabindex');
                const previousAriaLabel = card.getAttribute('aria-label');

                card.setAttribute('tabindex', '0');
                // Shared card renderers can add secondary clickable surfaces
                // after the primary card mounts. Preserve the visual affordance,
                // but give each one the credential name before exposing it to
                // assistive technology.
                if (!previousAriaLabel) card.setAttribute('aria-label', label);

                const handleKeyDown = (event: KeyboardEvent): void => {
                    if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) {
                        return;
                    }

                    event.preventDefault();
                    card.click();
                };

                card.addEventListener('keydown', handleKeyDown);
                enhancedCards.set(card, {
                    handler: handleKeyDown,
                    previousTabIndex,
                    previousAriaLabel,
                });
            });
        };

        enhanceCards();

        const observer = new MutationObserver(enhanceCards);
        observer.observe(container, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            primaryCardRef.current = null;

            demotedCards.forEach(({ previousRole, previousTabIndex, previousAriaLabel }, card) => {
                if (previousRole === null) card.removeAttribute('role');
                else card.setAttribute('role', previousRole);

                if (previousTabIndex === null) card.removeAttribute('tabindex');
                else card.setAttribute('tabindex', previousTabIndex);

                if (previousAriaLabel === null) card.removeAttribute('aria-label');
                else card.setAttribute('aria-label', previousAriaLabel);
            });

            Array.from(enhancedCards.keys()).forEach(restoreEnhancedCard);
        };
    }, [label]);

    return (
        <div ref={containerRef} className="contents">
            {children}
        </div>
    );
};

export default AccessibleCredentialCard;
