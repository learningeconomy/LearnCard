import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDownOutline } from 'ionicons/icons';

interface AppCapabilitiesSummaryProps {
    lines: string[];
    isWatching?: boolean;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

export const AppCapabilitiesSummary: React.FC<AppCapabilitiesSummaryProps> = ({
    lines,
    isWatching = false,
    defaultOpen = false,
    children,
}) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-[20px] border border-grayscale-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-grayscale-10 transition-colors"
            >
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-grayscale-900">
                            What your app does
                        </h3>
                        {isWatching && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Watching
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-grayscale-600 mt-0.5">
                        {lines.length > 0
                            ? lines.join(' · ')
                            : "Try your app and we'll list what it does here."}
                    </p>
                </div>
                <IonIcon
                    icon={chevronDownOutline}
                    className={`text-grayscale-500 text-xl shrink-0 ml-4 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {open && (
                <div className="px-6 pb-6 pt-5 border-t border-grayscale-100 space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};
