import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { ellipsisHorizontal, trashOutline } from 'ionicons/icons';

import { ModalTypes, useModal } from 'learn-card-base';

import type { ListingMode } from '../submit/listingLifecycle';
import { DeleteAppConfirmSheet } from './DeleteAppConfirmSheet';

export const isAppDeletable = (mode: ListingMode): boolean =>
    mode === 'draft' || mode === 'removed';

export interface DeleteAppMenuProps {
    listingId: string;
    integrationId: string | null;
    displayName: string;
    mode: ListingMode;
    onDeleted?: () => void;
    className?: string;
}

export const DeleteAppMenu: React.FC<DeleteAppMenuProps> = ({
    listingId,
    integrationId,
    displayName,
    mode,
    onDeleted,
    className,
}) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { newModal, closeModal } = useModal();

    useEffect(() => {
        if (!open) return undefined;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };
        const onPointerDown = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onPointerDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [open]);

    if (!isAppDeletable(mode)) return null;

    const openConfirm = () => {
        setOpen(false);
        newModal(
            <DeleteAppConfirmSheet
                listingId={listingId}
                integrationId={integrationId}
                displayName={displayName}
                onDismiss={() => closeModal()}
                onDeleted={onDeleted}
            />,
            {},
            { desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet }
        );
    };

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            <button
                type="button"
                aria-label="More options"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={event => {
                    event.stopPropagation();
                    setOpen(current => !current);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-500 hover:bg-grayscale-100 transition-colors"
            >
                <IonIcon icon={ellipsisHorizontal} className="text-lg" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-9 z-10 w-44 bg-white rounded-2xl border border-grayscale-200 shadow-lg py-1.5 animate-fade-in-up"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={event => {
                            event.stopPropagation();
                            openConfirm();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <IonIcon icon={trashOutline} className="text-base" />
                        Delete draft
                    </button>
                </div>
            )}
        </div>
    );
};

export default DeleteAppMenu;
