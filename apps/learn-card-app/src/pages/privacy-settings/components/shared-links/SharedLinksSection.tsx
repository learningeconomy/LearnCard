import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { addOutline } from 'ionicons/icons';
import type { ShareLink } from '@learncard/types';
import { ModalTypes, useModal } from 'learn-card-base';

import * as m from '../../../../paraglide/messages.js';
import type {
    DataSharingSharedLinksViewModel,
    SharedLinkFilter,
} from '../../DataSharingCenter.types';
import { ShareCredentialsIllustration } from '../../../../components/share-links/ShareCredentialsIllustration';
import GlassCard from '../GlassCard';
import {
    ListShell,
    MessageRow,
    QuietTextButton,
    SectionHeader,
    SkeletonRows,
    ViewAllRow,
} from './ListCard';
import ReceivedCollectionRow from './ReceivedCollectionRow';
import ShareLinkDetailSheet from './ShareLinkDetailSheet';
import SharedLinksAllSheet from './SharedLinksAllSheet';
import SharedWithYouAllSheet from './SharedWithYouAllSheet';
import ShareLinkRow from './ShareLinkRow';
import { useSharedLinksStore } from './sharedLinksStore';
import {
    PREVIEW_LIMIT,
    activeCountLabel,
    getSharedLinkViewStatus,
    selectPreviewShares,
    viewAllLabel,
} from './sharedLinkFormat';

/** Filters to fall back to, in order, when View all would otherwise open on an empty Active tab. */
const FALLBACK_FILTERS: SharedLinkFilter[] = ['expired', 'stopped'];

const SHARE_SHEET = { desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet };
const FULL_SHEET = { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen };

/**
 * Returns the row keys that should play the entrance stagger. The set is taken
 * once, the first render the list shows rows, and never changes afterwards, so
 * that batch keeps a stable `animate` flag while its stagger runs and rows
 * that arrive later appear without animating.
 */
const useFirstRevealKeys = (keys: string[]): ReadonlySet<string> => {
    const revealed = useRef<ReadonlySet<string> | null>(null);
    // Intentional render-time write: it happens once and is idempotent.
    if (revealed.current === null && keys.length > 0) revealed.current = new Set(keys);
    return revealed.current ?? EMPTY_KEYS;
};
const EMPTY_KEYS: ReadonlySet<string> = new Set();

const RetryButton: React.FC<{ onClick: () => Promise<void> }> = ({ onClick }) => (
    <button
        type="button"
        className="text-sm font-medium text-grayscale-700 underline"
        onClick={() => void onClick()}
    >
        {m['shareLinks.retry']()}
    </button>
);

const shareKey = (share: ShareLink): string => `${share.id}:${share.version}`;

/**
 * The calm Shared section: a short "Your shared links" list and a short
 * "Shared with you" list. Management lives in sheets opened with `newModal`;
 * because modal content is a static snapshot, the live view model is published
 * to `useSharedLinksStore` and the sheets read it from there.
 */
const SharedLinksSection: React.FC<{ vm: DataSharingSharedLinksViewModel; delay?: number }> = ({
    vm,
    delay = 0,
}) => {
    const { newModal, closeModalById } = useModal();
    const setVm = useSharedLinksStore(state => state.setVm);

    useLayoutEffect(() => {
        setVm(vm);
    }, [setVm, vm]);
    useLayoutEffect(() => () => setVm(null), [setVm]);

    const preview = useMemo(() => selectPreviewShares(vm.records), [vm.records]);
    const counts = useMemo(() => {
        const next: Record<SharedLinkFilter, number> = { active: 0, expired: 0, stopped: 0 };
        for (const record of vm.records) next[getSharedLinkViewStatus(record)] += 1;
        return next;
    }, [vm.records]);
    const activeCount = counts.active;
    const saved = vm.savedCollections;
    const savedPreview = saved.records.slice(0, PREVIEW_LIMIT);
    const animatedLinkKeys = useFirstRevealKeys(preview.map(shareKey));
    const animatedReceivedKeys = useFirstRevealKeys(savedPreview.map(collection => collection.uri));

    /**
     * Opens a sheet and hands it an `onClose` bound to its own modal id, so a
     * sheet closing itself never dismisses whatever is stacked above it.
     */
    const openSheet = useCallback(
        (
            render: (onClose: () => void) => React.ReactNode,
            types: { desktop: ModalTypes; mobile: ModalTypes }
        ) => {
            const handle: { id?: number } = {};
            const onClose = () => {
                if (handle.id !== undefined) closeModalById(handle.id);
            };
            handle.id = newModal(render(onClose), {}, types);
        },
        [closeModalById, newModal]
    );

    const openShare = useCallback(
        (share: ShareLink) => {
            openSheet(
                onClose => (
                    <ShareLinkDetailSheet shareId={share.id} fallback={share} onClose={onClose} />
                ),
                SHARE_SHEET
            );
        },
        [openSheet]
    );

    const openAllLinks = () => {
        if (activeCount > 0) {
            // A previous open may have auto-switched away from Active.
            if (vm.filter !== 'active') vm.onFilterChange('active');
        } else if (vm.filter === 'active') {
            const fallback = FALLBACK_FILTERS.find(filter => counts[filter] > 0);
            if (fallback) vm.onFilterChange(fallback);
        }
        openSheet(
            onClose => <SharedLinksAllSheet onClose={onClose} onOpenShare={openShare} />,
            FULL_SHEET
        );
    };
    const openAllReceived = () => {
        openSheet(onClose => <SharedWithYouAllSheet onClose={onClose} />, FULL_SHEET);
    };

    const nothingAtAll = !vm.isLoading && !vm.error && vm.records.length === 0 && !vm.hasMore;
    const hideReceived =
        nothingAtAll && !saved.isLoading && !saved.error && saved.records.length === 0;
    const showLinksViewAll = vm.records.length > preview.length || vm.hasMore;
    const newLinkButton = (
        <QuietTextButton icon={addOutline} onClick={vm.onCreateShare}>
            {m['dataShareCenter.shared.newLink']()}
        </QuietTextButton>
    );

    return (
        <div
            className="animate-fade-in-up flex flex-col gap-6"
            style={delay ? { animationDelay: `${delay}ms`, animationFillMode: 'both' } : undefined}
        >
            <section>
                <SectionHeader
                    title={m['dataShareCenter.shared.yourLinks']()}
                    caption={activeCount > 0 ? activeCountLabel(activeCount) : undefined}
                    action={newLinkButton}
                />
                {nothingAtAll ? (
                    <GlassCard className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                        <ShareCredentialsIllustration className="h-16 w-16" />
                        <p className="font-medium text-grayscale-900">
                            {m['dataShareCenter.shared.emptyTitle']()}
                        </p>
                        <p className="text-sm text-grayscale-600">
                            {m['dataShareCenter.shared.emptyLinksBody']()}
                        </p>
                        <button
                            type="button"
                            onClick={vm.onCreateShare}
                            className="mt-1 rounded-[20px] bg-grayscale-900 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                        >
                            {m['dataShareCenter.shared.newLink']()}
                        </button>
                    </GlassCard>
                ) : (
                    <ListShell label={m['dataShareCenter.shared.yourLinks']()}>
                        {vm.isLoading && vm.records.length === 0 ? (
                            <SkeletonRows />
                        ) : vm.error && vm.records.length === 0 ? (
                            <MessageRow
                                tone="error"
                                action={<RetryButton onClick={vm.onRefresh} />}
                            >
                                {m['dataShareCenter.shared.loadError']()}
                            </MessageRow>
                        ) : preview.length === 0 ? (
                            <MessageRow>{m['dataShareCenter.shared.noActive']()}</MessageRow>
                        ) : (
                            preview.map((share, index) => (
                                <ShareLinkRow
                                    key={shareKey(share)}
                                    share={share}
                                    index={index}
                                    animate={animatedLinkKeys.has(shareKey(share))}
                                    pending={Boolean(vm.pendingActions[share.id])}
                                    busy={vm.busyId === share.id}
                                    showViewStats={vm.showViewStats}
                                    onOpen={openShare}
                                    onCopy={vm.onCopy}
                                />
                            ))
                        )}
                        {showLinksViewAll && (
                            <ViewAllRow
                                label={viewAllLabel(vm.records.length, vm.hasMore)}
                                onClick={openAllLinks}
                            />
                        )}
                        {vm.error && vm.records.length > 0 && (
                            <MessageRow
                                tone="error"
                                action={<RetryButton onClick={vm.onRefresh} />}
                            >
                                {m['dataShareCenter.shared.loadError']()}
                            </MessageRow>
                        )}
                    </ListShell>
                )}
            </section>

            {!hideReceived && (
                <section>
                    <SectionHeader title={m['dataShareCenter.shared.sharedWithYou']()} />
                    <ListShell label={m['dataShareCenter.shared.sharedWithYou']()}>
                        {saved.isLoading && saved.records.length === 0 ? (
                            <SkeletonRows count={2} />
                        ) : saved.error && saved.records.length === 0 ? (
                            <MessageRow
                                tone="error"
                                action={<RetryButton onClick={saved.onRefresh} />}
                            >
                                {m['dataShareCenter.shared.savedLoadError']()}
                            </MessageRow>
                        ) : saved.records.length === 0 ? (
                            <MessageRow>{m['dataShareCenter.shared.receivedEmpty']()}</MessageRow>
                        ) : (
                            savedPreview.map((collection, index) => (
                                <ReceivedCollectionRow
                                    key={collection.uri}
                                    collection={collection}
                                    index={index}
                                    animate={animatedReceivedKeys.has(collection.uri)}
                                    onOpen={saved.onPreview}
                                />
                            ))
                        )}
                        {saved.records.length > PREVIEW_LIMIT && (
                            <ViewAllRow
                                label={viewAllLabel(saved.records.length, false)}
                                onClick={openAllReceived}
                            />
                        )}
                        {saved.error && saved.records.length > 0 && (
                            <MessageRow
                                tone="error"
                                action={<RetryButton onClick={saved.onRefresh} />}
                            >
                                {m['dataShareCenter.shared.savedLoadError']()}
                            </MessageRow>
                        )}
                    </ListShell>
                </section>
            )}
        </div>
    );
};

export default SharedLinksSection;
