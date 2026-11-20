import React from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';

export const ClrRecordDrawerSection = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => (
    <details open className="group mt-2 border-t border-grayscale-300">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-3 text-lg font-semibold leading-snug text-grayscale-900 focus-visible:outline-2 focus-visible:outline-emerald-600 [&::-webkit-details-marker]:hidden">
            {title}
            <IonIcon
                aria-hidden="true"
                icon={chevronDownOutline}
                className="size-5 shrink-0 text-grayscale-700 group-not-open:-rotate-90 rtl:group-not-open:rotate-90 motion-safe:transition-transform"
            />
        </summary>
        <div className="pb-3 pt-2">{children}</div>
    </details>
);
