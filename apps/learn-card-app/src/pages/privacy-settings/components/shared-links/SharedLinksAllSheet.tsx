import React, { useEffect, useMemo, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowBack, refreshOutline } from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';

import * as m from '../../../../paraglide/messages.js';
import '../../dataSharingCenter.scss';
import type { SharedLinkFilter } from '../../DataSharingCenter.types';
import { ListShell, MessageRow, SkeletonRows } from './ListCard';
import ShareLinkRow from './ShareLinkRow';
import { useSharedLinksStore } from './sharedLinksStore';
import { getSharedLinkViewStatus, sortNewestFirst, statusLabel } from './sharedLinkFormat';

export const SheetChrome: React.FC<{
    title: string;
    onClose: () => void;
    refreshing: boolean;
    onRefresh: () => void;
    children: React.ReactNode;
}> = ({ title, onClose, refreshing, onRefresh, children }) => (
    <div className="ds-content-bg min-h-full w-full">
        <div className="mx-auto w-full max-w-[820px] px-5 pb-14 pt-[max(16px,calc(env(safe-area-inset-top)+8px))]">
            <div className="mb-4 flex items-center gap-2">
                <button
                    type="button"
                    aria-label={m['common.back']()}
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xl text-grayscale-700 hover:bg-white/70"
                >
                    <IonIcon icon={arrowBack} aria-hidden="true" className="rtl:-scale-x-100" />
                </button>
                <h2 className="flex-1 truncate text-lg font-semibold text-grayscale-900">
                    {title}
                </h2>
                <button
                    type="button"
                    aria-label={m['dataShareCenter.shared.refresh']()}
                    disabled={refreshing}
                    onClick={onRefresh}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-lg text-grayscale-600 hover:bg-white/70 disabled:opacity-60"
                >
                    <IonIcon
                        icon={refreshOutline}
                        aria-hidden="true"
                        className={refreshing ? 'motion-safe:animate-spin' : undefined}
                    />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const FILTERS: SharedLinkFilter[] = ['active', 'expired', 'stopped'];

/** True when arrow keys should read right-to-left: the tablist's own computed
 *  direction wins, falling back to the document's `dir`. */
const isRtlContext = (element: HTMLElement | null): boolean => {
    if (element && getComputedStyle(element).direction === 'rtl') return true;
    return document.documentElement.dir === 'rtl';
};

const SharedLinksAllSheet: React.FC<{
    onClose: () => void;
    onOpenShare: (share: ShareLink) => void;
}> = ({ onClose, onOpenShare }) => {
    const vm = useSharedLinksStore(state => state.vm);
    const tablistRef = useRef<HTMLDivElement | null>(null);
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const hadVmRef = useRef(false);

    // If the section unmounts (or the store is otherwise cleared), the store's
    // `vm` transitions to null under an open sheet. Close it rather than
    // lingering as an empty modal.
    useEffect(() => {
        if (vm) {
            hadVmRef.current = true;
        } else if (hadVmRef.current) {
            onClose();
        }
    }, [vm, onClose]);
    const counts = useMemo(() => {
        const next: Record<SharedLinkFilter, number> = { active: 0, expired: 0, stopped: 0 };
        for (const record of vm?.records ?? []) next[getSharedLinkViewStatus(record)] += 1;
        return next;
    }, [vm?.records]);
    const filtered = useMemo(
        () =>
            sortNewestFirst(
                (vm?.records ?? []).filter(record => getSharedLinkViewStatus(record) === vm?.filter)
            ),
        [vm?.filter, vm?.records]
    );

    if (!vm) return null;

    const focusFilter = (index: number) => {
        vm.onFilterChange(FILTERS[index]);
        tabRefs.current[index]?.focus();
    };

    const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        const { key } = event;
        if (key === 'Home') {
            event.preventDefault();
            focusFilter(0);
            return;
        }
        if (key === 'End') {
            event.preventDefault();
            focusFilter(FILTERS.length - 1);
            return;
        }
        if (key !== 'ArrowLeft' && key !== 'ArrowRight') return;
        event.preventDefault();
        let direction = key === 'ArrowRight' ? 1 : -1;
        if (isRtlContext(tablistRef.current)) direction = -direction;
        const nextIndex = (index + direction + FILTERS.length) % FILTERS.length;
        focusFilter(nextIndex);
    };

    return (
        <SheetChrome
            title={m['dataShareCenter.shared.yourLinks']()}
            onClose={onClose}
            refreshing={vm.isLoading}
            onRefresh={() => void vm.onRefresh()}
        >
            <div
                ref={tablistRef}
                role="tablist"
                aria-label={m['dataShareCenter.shared.filterLabel']()}
                className="mb-3 grid grid-cols-3 gap-1 rounded-[20px] bg-white/70 p-1 ring-1 ring-grayscale-900/[0.06]"
            >
                {FILTERS.map((filter, index) => (
                    <button
                        key={filter}
                        ref={element => {
                            tabRefs.current[index] = element;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={vm.filter === filter}
                        tabIndex={vm.filter === filter ? 0 : -1}
                        onClick={() => vm.onFilterChange(filter)}
                        onKeyDown={event => handleTabKeyDown(event, index)}
                        className={`rounded-[16px] px-3 py-2 text-sm font-medium transition-colors ${vm.filter === filter ? 'bg-grayscale-900 text-white' : 'text-grayscale-600 hover:text-grayscale-900'}`}
                    >
                        {statusLabel(filter)}
                        <span
                            className={`ms-1.5 text-xs ${vm.filter === filter ? 'text-white/70' : 'text-grayscale-600'}`}
                        >
                            {counts[filter]}
                        </span>
                    </button>
                ))}
            </div>

            <ListShell label={statusLabel(vm.filter)}>
                {vm.isLoading && vm.records.length === 0 ? (
                    <SkeletonRows count={5} />
                ) : vm.error && vm.records.length === 0 ? (
                    <MessageRow
                        tone="error"
                        action={
                            <button
                                type="button"
                                className="text-sm font-medium text-grayscale-700 underline"
                                onClick={() => void vm.onRefresh()}
                            >
                                {m['shareLinks.retry']()}
                            </button>
                        }
                    >
                        {m['dataShareCenter.shared.loadError']()}
                    </MessageRow>
                ) : filtered.length === 0 ? (
                    <MessageRow>
                        {vm.hasMore
                            ? m['dataShareCenter.shared.emptyFilterMore']()
                            : m['dataShareCenter.shared.emptyFilter']()}
                    </MessageRow>
                ) : (
                    filtered.map(share => (
                        <ShareLinkRow
                            key={`${share.id}:${share.version}`}
                            share={share}
                            pending={Boolean(vm.pendingActions[share.id])}
                            busy={vm.busyId === share.id}
                            showViewStats={vm.showViewStats}
                            onOpen={onOpenShare}
                            onCopy={vm.onCopy}
                        />
                    ))
                )}
            </ListShell>

            {vm.error && vm.records.length > 0 && (
                <p
                    role="alert"
                    className="mt-3 flex items-center justify-between gap-2 text-sm text-red-700"
                >
                    <span>{m['dataShareCenter.shared.loadError']()}</span>
                    <button
                        type="button"
                        className="shrink-0 font-medium underline"
                        onClick={() => void vm.onRefresh()}
                    >
                        {m['shareLinks.retry']()}
                    </button>
                </p>
            )}

            {vm.hasMore && (
                <button
                    type="button"
                    disabled={vm.isLoadingMore}
                    onClick={() => void vm.onLoadMore()}
                    className="mt-3 w-full rounded-[20px] ring-1 ring-inset ring-grayscale-300 bg-white/80 px-4 py-2.5 text-sm font-medium text-grayscale-700 hover:bg-white disabled:opacity-40"
                >
                    {vm.isLoadingMore
                        ? m['dataShareCenter.shared.loading']()
                        : m['dataShareCenter.shared.loadMore']()}
                </button>
            )}
        </SheetChrome>
    );
};

export default SharedLinksAllSheet;
