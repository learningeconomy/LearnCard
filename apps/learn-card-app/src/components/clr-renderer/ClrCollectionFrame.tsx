import React from 'react';
import type { ClrLayoutKind } from 'learn-card-base/helpers/credentials/clr/renderer';

/** Shared dual-host frame. AppModal supplies zero insets; route hosts may opt out. */
export const ClrCollectionFrame = ({
    children,
    insetTop = true,
    layout,
}: {
    children: React.ReactNode;
    insetTop?: boolean;
    layout: ClrLayoutKind;
}) => (
    <div
        data-clr-layout={layout}
        className={`flex min-h-full w-full flex-col font-poppins ${insetTop ? 'pt-[var(--ion-safe-area-top,0px)]' : ''}`}
    >
        {children}
    </div>
);
