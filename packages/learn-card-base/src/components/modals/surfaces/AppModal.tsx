import React from 'react';

import GenericErrorBoundary from '../../generic/GenericErrorBoundary';

export type AppModalVariant =
    'fullscreen' | 'right' | 'center' | 'cancel' | 'select' | 'bottom-sheet' | 'freeform';

/** Variants whose centering CONTAINER (the aside) owns the inset instead of the surface. */
const CONTAINER_INSET_VARIANTS: AppModalVariant[] = ['center', 'cancel', 'select'];

export interface AppModalProps {
    /** DOM id for the aside root — must match the legacy shell id so existing SCSS applies. */
    rootId: string;
    variant: AppModalVariant;
    open: boolean;
    onDimmerClick: () => void;
    hideDimmer?: boolean;
    /** Extra classes on the aside root (legacy `options.className` etc.). */
    rootClassName?: string;
    /** Inline styles on the aside root (legacy inline `style` on the aside, e.g. FullScreenModal's background image). */
    rootStyle?: React.CSSProperties;
    /** Extra classes on the section surface (legacy `options.sectionClassName` etc.). */
    sectionClassName?: string;
    sectionStyle?: React.CSSProperties;
    /** Extra props spread onto the section (drag handlers, refs via `ref` key, etc.). */
    sectionProps?: React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> };
    /** In-flow slots. Footer in normal flow is what kills the absolute-footer bug class. */
    header?: React.ReactNode;
    footer?: React.ReactNode;
    /** Content extends under the insets; surface paints scrims instead of padding. */
    fullBleed?: boolean;
    /** 'none' = this overlay owns a fresh viewport (nested overlays). Default 'auto'. */
    inset?: 'auto' | 'none';
    /** Rendered between dimmer and section (e.g. CenterModal's X button). */
    beforeSection?: React.ReactNode;
    /** Sibling content AFTER the section (e.g. CancelModal's separate Close-pill
     * and portal sections — the per-id SCSS styles each aside > section as its
     * own floating card, so these must NOT be nested inside the main section). */
    afterSection?: React.ReactNode;
    errorBoundaryButtons?: { label: string; onClick: () => void }[];
    children: React.ReactNode;
}

/**
 * The single modal layout primitive. Owns device safe-area insets so modal
 * content never has to (see scripts/check-safe-area.mjs). Renders the exact
 * legacy DOM: aside#<id> > [dimmer] + section.
 */
export const AppModal: React.FC<AppModalProps> = ({
    rootId,
    variant,
    open,
    onDimmerClick,
    hideDimmer,
    rootClassName = '',
    rootStyle,
    sectionClassName = '',
    sectionStyle,
    sectionProps,
    header,
    footer,
    fullBleed,
    inset = 'auto',
    beforeSection,
    afterSection,
    errorBoundaryButtons,
    children,
}) => {
    const containerOwnsInset = CONTAINER_INSET_VARIANTS.includes(variant);

    const surfaceClasses = [
        'lc-surface',
        `lc-surface--${variant}`,
        fullBleed ? 'lc-surface--full-bleed' : '',
        inset === 'none' ? 'lc-surface--no-inset' : '',
    ]
        .filter(Boolean)
        .join(' ');

    const asideClasses = [
        rootClassName,
        open ? 'open' : 'closed',
        containerOwnsInset ? `lc-overlay--${variant} lc-overlay--inset-container` : '',
        inset === 'none' && containerOwnsInset ? 'lc-overlay--no-inset' : '',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <aside id={rootId} className={asideClasses} style={rootStyle} data-lc-surface={variant}>
            {!hideDimmer && (
                <button
                    className={`${rootId}-dimmer`}
                    type="button"
                    onClick={onDimmerClick}
                    aria-label="modal-dimmer"
                    aria-hidden
                />
            )}
            {beforeSection}
            <section
                className={`${containerOwnsInset ? '' : surfaceClasses} ${sectionClassName}`.trim()}
                style={sectionStyle}
                {...sectionProps}
            >
                {header}
                <GenericErrorBoundary extraButtons={errorBoundaryButtons}>
                    {children}
                </GenericErrorBoundary>
                {footer}
            </section>
            {afterSection}
        </aside>
    );
};

export default AppModal;
