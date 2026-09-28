import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { filterOutline } from 'ionicons/icons';
import type { CredentialCategoryEnum } from 'learn-card-base';
import { ActivityFilterPopover } from '../../pages/wallet/activity-feed/ActivityFilterPopover';
import useTheme from '../../theme/hooks/useTheme';
import * as m from '../../paraglide/messages.js';

export const ShareCategoryFilter = ({
    value,
    onChange,
    categories,
}: {
    value: string;
    onChange: (value: string) => void;
    categories: string[];
}) => {
    const { getThemedCategory } = useTheme();
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const close = () => {
        setOpen(false);
        trigger.current?.focus();
    };
    useEffect(() => {
        if (!open) return;
        panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
        const outside = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    const label = (category: string) =>
        getThemedCategory(category as CredentialCategoryEnum)?.category?.labels.plural || category;
    return (
        <div
            ref={root}
            className="shrink-0 flex"
            onKeyDown={event => {
                if (open && event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    close();
                }
            }}
            onBlur={event => {
                if (
                    event.relatedTarget &&
                    !event.currentTarget.contains(event.relatedTarget as Node)
                )
                    setOpen(false);
            }}
        >
            <button
                ref={trigger}
                type="button"
                aria-label={value ? label(value) : m['passport.activity.filter']()}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls={open ? 'share-category-panel' : undefined}
                onClick={() => setOpen(current => !current)}
                className={`flex h-full min-h-11 items-center justify-center gap-2 rounded-[20px] border px-3 sm:px-4 py-2.5 text-sm font-medium text-grayscale-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${value ? 'bg-emerald-50 border-emerald-300' : 'bg-grayscale-100 border-transparent hover:bg-grayscale-200'}`}
            >
                <IonIcon aria-hidden="true" icon={filterOutline} className="h-5 w-5" />
                <span className="hidden sm:inline">{m['passport.activity.filter']()}</span>
                {value && (
                    <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
            </button>
            {open && (
                <div ref={panel} className="absolute end-0 top-full z-20 mt-2 w-[320px] max-w-full">
                    <ActivityFilterPopover
                        id="share-category-panel"
                        selected={(value || 'all') as CredentialCategoryEnum | 'all'}
                        filters={[
                            { id: 'all', label: m['shareLinks.allCategories']() },
                            ...categories.map(category => ({
                                id: category as CredentialCategoryEnum,
                                label: label(category),
                            })),
                        ]}
                        onApply={category => {
                            onChange(category === 'all' ? '' : category);
                            close();
                        }}
                        onReset={() => {
                            onChange('');
                            close();
                        }}
                    />
                </div>
            )}
        </div>
    );
};
