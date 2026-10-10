import React, { useId } from 'react';
import { IonIcon } from '@ionic/react';
import { searchOutline, closeOutline } from 'ionicons/icons';
import type { CredentialCategoryEnum } from 'learn-card-base';
import useTheme from '../../theme/hooks/useTheme';
import * as m from '../../paraglide/messages.js';
import { ShareCategoryFilter } from './ShareCategoryFilter';
import { ShareSearchEmpty } from './ShareSearchEmpty';
import type { CredentialChoice } from './shareLinkFlow';
import { ShareCredentialSelectionRow } from './ShareCredentialSelectionRow';
import './ShareLinkCreate.css';

type ShareCredentialPickerProps = {
    filtered: CredentialChoice[];
    selected: string[];
    onToggle: (uri: string) => void;
    onDeselectAll: () => void;
    selectedOnly: boolean;
    setSelectedOnly: React.Dispatch<React.SetStateAction<boolean>>;
    selectedCategoryCount: number;
    selectionLimit?: number;
    search: string;
    setSearch: React.Dispatch<React.SetStateAction<string>>;
    onClearSearch: () => void;
    searchInput: React.RefObject<HTMLInputElement>;
    settledSearch: string;
    searchPending: boolean;
    categoryFilter: string;
    setCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
    categories: string[];
    indexReady: boolean;
    loading: boolean;
    failedReads: Set<string>;
};

/** Shared selection UI only: callers own eligible credentials, limits, loading and delivery. */
export const ShareCredentialPicker = ({
    filtered,
    selected,
    onToggle,
    onDeselectAll,
    selectedOnly,
    setSelectedOnly,
    selectedCategoryCount,
    selectionLimit,
    search,
    setSearch,
    onClearSearch,
    searchInput,
    settledSearch,
    searchPending,
    categoryFilter,
    setCategoryFilter,
    categories,
    indexReady,
    loading,
    failedReads,
}: ShareCredentialPickerProps) => {
    const searchId = useId();
    const { getThemedCategory } = useTheme();
    return (
        <>
            <div hidden={selectedOnly} className="space-y-4">
                <div>
                    <label
                        htmlFor={searchId}
                        className="block text-xs font-medium text-grayscale-700 mb-2"
                    >
                        {m['shareLinks.search']()}
                    </label>
                    <div className="relative flex items-stretch gap-2">
                        <div className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-grayscale-300 bg-grayscale-10 px-3 transition-colors hover:border-grayscale-400 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500">
                            <IonIcon
                                aria-hidden="true"
                                icon={searchOutline}
                                className="h-5 w-5 shrink-0 text-grayscale-400 transition-colors group-focus-within:text-emerald-600"
                            />
                            <input
                                ref={searchInput}
                                id={searchId}
                                className="share-credential-search w-full min-w-0 py-3 bg-transparent text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
                                placeholder={m['shareLinks.searchPlaceholder']()}
                                value={search}
                                onChange={event => setSearch(event.target.value)}
                                type="search"
                            />
                            {search && (
                                <button
                                    type="button"
                                    aria-label={m['shareLinks.clearSearch']()}
                                    onClick={() => {
                                        onClearSearch();
                                        searchInput.current?.focus();
                                    }}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-grayscale-600 hover:bg-grayscale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <IonIcon
                                        aria-hidden="true"
                                        icon={closeOutline}
                                        className="h-4 w-4"
                                    />
                                </button>
                            )}
                        </div>
                        <ShareCategoryFilter
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            categories={categories}
                        />
                    </div>
                </div>
                {categoryFilter && (
                    <p className="text-xs text-grayscale-600">
                        {m['shareLinks.categoryFilter']()}:{' '}
                        {getThemedCategory(categoryFilter as CredentialCategoryEnum)?.category
                            ?.labels.plural || categoryFilter}
                    </p>
                )}
            </div>
            <div className="rounded-2xl bg-grayscale-100 p-4 space-y-3">
                <div className="flex justify-between items-start gap-3 text-xs text-grayscale-600">
                    <div>
                        <p className="font-medium text-grayscale-900">
                            {m['shareLinks.selected']({
                                count: String(selected.length),
                            })}
                        </p>
                        {selectedCategoryCount > 0 && (
                            <p className="mt-1">
                                {selectedCategoryCount === 1
                                    ? m['shareLinks.oneCategory']()
                                    : m['shareLinks.categoryCount']({
                                          count: String(selectedCategoryCount),
                                      })}
                            </p>
                        )}
                    </div>
                    {selectionLimit === 50 && (
                        <span className="shrink-0">{m['shareLinks.limit']()}</span>
                    )}
                </div>
                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            aria-pressed={selectedOnly}
                            onClick={() => setSelectedOnly(current => !current)}
                            className="rounded-[20px] bg-white px-4 py-2 text-xs font-medium text-grayscale-900 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            {selectedOnly
                                ? m['shareLinks.browseAll']()
                                : m['shareLinks.viewSelected']()}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onDeselectAll();
                            }}
                            className="rounded-[20px] px-3 py-2 text-xs font-medium text-grayscale-600 hover:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500"
                        >
                            {m['shareLinks.deselectAll']()}
                        </button>
                    </div>
                )}
            </div>
            <p role="status" className="min-h-5 text-xs text-grayscale-500">
                {searchPending
                    ? m['shareLinks.searchUpdating']()
                    : !indexReady
                      ? m['shareLinks.loading']()
                      : null}
            </p>
            <div
                aria-busy={searchPending}
                className={`space-y-3 motion-safe:transition-opacity motion-safe:duration-200 ${searchPending ? 'opacity-60' : 'opacity-100'}`}
            >
                {filtered.map(choice => (
                    <ShareCredentialSelectionRow
                        key={choice.uri}
                        choice={choice}
                        checked={selected.includes(choice.uri)}
                        disabled={
                            !choice.credential ||
                            (selectionLimit !== undefined &&
                                !selected.includes(choice.uri) &&
                                selected.length >= selectionLimit)
                        }
                        loadFailed={failedReads.has(choice.uri)}
                        onToggle={() => onToggle(choice.uri)}
                    />
                ))}
            </div>
            {!filtered.length && !loading && !searchPending && (
                <ShareSearchEmpty
                    searching={Boolean(settledSearch)}
                    onClear={() => {
                        onClearSearch();
                        searchInput.current?.focus();
                    }}
                />
            )}
        </>
    );
};
