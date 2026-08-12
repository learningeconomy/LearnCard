import React from 'react';

import BoostFooter, { type BoostFooterProps } from './BoostFooter';

export type BoostFooterLayoutProps = React.PropsWithChildren<{
    footerProps?: BoostFooterProps;
    className?: string;
    contentClassName?: string;
    footerClassName?: string;
    /** Set when a nested component such as IonContent owns scrolling. */
    contentOwnsScroll?: boolean;
}>;

/**
 * Full-height layout for screens that end with a {@link BoostFooter}.
 *
 * The footer stays in normal document flow, so the content region automatically
 * accounts for the footer's design height and live system-bar inset.
 */
export const BoostFooterLayout: React.FC<BoostFooterLayoutProps> = ({
    children,
    footerProps,
    className = '',
    contentClassName = '',
    footerClassName = '',
    contentOwnsScroll = false,
}) => (
    <div className={`relative flex min-h-0 w-full flex-1 flex-col ${className}`}>
        <div
            className={`min-h-0 flex-1 ${
                contentOwnsScroll ? 'overflow-hidden' : 'overflow-y-auto'
            } ${contentClassName}`}
        >
            {children}
        </div>

        {footerProps && (
            <div className={`relative z-10 w-full shrink-0 ${footerClassName}`}>
                <BoostFooter {...footerProps} />
            </div>
        )}
    </div>
);

export default BoostFooterLayout;
