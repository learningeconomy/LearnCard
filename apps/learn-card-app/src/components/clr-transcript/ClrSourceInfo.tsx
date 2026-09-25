import React, { useState } from 'react';
import { IonPopover } from '@ionic/react';
import { Info } from 'lucide-react';

import type { SourceMappedField } from '../../helpers/clrRenderer.helpers';

const ClrSourceInfo: React.FC<{
    field?: SourceMappedField<unknown>;
    label: string;
}> = ({ field, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);

    if (!field) return null;

    return (
        <>
            <button
                type="button"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-grayscale-400 hover:bg-grayscale-100 hover:text-grayscale-700"
                aria-label={`Show ${label} source`}
                aria-expanded={isOpen}
                onClick={event => {
                    setPopoverEvent(event.nativeEvent);
                    setIsOpen(true);
                }}
            >
                <Info className="h-3.5 w-3.5" />
            </button>
            <IonPopover
                isOpen={isOpen}
                event={popoverEvent}
                reference="event"
                side="bottom"
                alignment="end"
                onDidDismiss={() => {
                    setIsOpen(false);
                    setPopoverEvent(undefined);
                }}
                className="[--max-width:calc(100vw_-_2rem)] [--width:16rem]"
            >
                <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-medium text-grayscale-700">{field.specField}</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-grayscale-500">
                        {field.sourcePath}
                    </p>
                </div>
            </IonPopover>
        </>
    );
};

export default ClrSourceInfo;
