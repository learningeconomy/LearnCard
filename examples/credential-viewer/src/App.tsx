import React, { useState, useMemo, useCallback } from 'react';

import {
    getAllFixtures,
    getStats,
    type CredentialFixture,
} from '@learncard/credential-library';

import { WalletProvider } from './context/WalletContext';
import { FilterBar, type Filters } from './components/FilterBar';
import { FixtureCard } from './components/FixtureCard';
import { DetailPanel } from './components/DetailPanel';
import { ConnectBar } from './components/ConnectBar';
import { BulkActionBar } from './components/BulkActionBar';
import { IssuePanel } from './components/IssuePanel';
import { SendPanel } from './components/SendPanel';
import { NewFixturePanel } from './components/NewFixturePanel';
import { SPEC_LABELS } from './lib/colors';
import { getCategoryForCredential } from './lib/category';

const allFixtures = getAllFixtures();
const stats = getStats();

const EMPTY_FILTERS: Filters = {
    specs: [],
    profiles: [],
    validity: [],
    categories: [],
    search: '',
};

const AppInner: React.FC = () => {
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
    const [showBulkIssue, setShowBulkIssue] = useState(false);
    const [showBulkSend, setShowBulkSend] = useState(false);
    const [showFilters, setShowFilters] = useState(true);
    const [showNewFixture, setShowNewFixture] = useState(false);

    const filtered = useMemo(() => {
        return allFixtures.filter(f => {
            if (filters.specs.length > 0 && !filters.specs.includes(f.spec)) return false;

            if (filters.profiles.length > 0 && !filters.profiles.includes(f.profile)) return false;

            if (filters.validity.length > 0 && !filters.validity.includes(f.validity)) return false;

            if (filters.categories.length > 0) {
                const cat = getCategoryForCredential(f.credential as Record<string, unknown>);

                if (!filters.categories.includes(cat)) return false;
            }

            if (filters.search) {
                const q = filters.search.toLowerCase();
                const searchable = `${f.id} ${f.name} ${f.description} ${f.tags?.join(' ') || ''} ${f.features.join(' ')}`.toLowerCase();

                if (!searchable.includes(q)) return false;
            }

            return true;
        });
    }, [filters]);

    const selectedFixture = useMemo(() => {
        if (!selectedId) return null;

        return allFixtures.find(f => f.id === selectedId) ?? null;
    }, [selectedId]);

    const checkedFixtures = useMemo(() => {
        return allFixtures.filter(f => checkedIds.has(f.id));
    }, [checkedIds]);

    const toggleChecked = useCallback((id: string) => {
        setCheckedIds(prev => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }, []);

    const toggleAllFiltered = useCallback(() => {
        const validFiltered = filtered.filter(f => f.validity === 'valid');
        const allChecked = validFiltered.every(f => checkedIds.has(f.id));

        if (allChecked) {
            setCheckedIds(prev => {
                const next = new Set(prev);

                validFiltered.forEach(f => next.delete(f.id));

                return next;
            });
        } else {
            setCheckedIds(prev => {
                const next = new Set(prev);

                validFiltered.forEach(f => next.add(f.id));

                return next;
            });
        }
    }, [filtered, checkedIds]);

    const hasActiveFilters =
        filters.specs.length > 0 ||
        filters.profiles.length > 0 ||
        filters.validity.length > 0 ||
        filters.categories.length > 0;

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Compact top bar */}
            <header className="flex-shrink-0 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm z-10">
                <div className="max-w-[1800px] mx-auto px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>

                            <h1 className="text-sm font-bold text-white">
                                Credential Library Viewer
                            </h1>

                            <div className="flex items-center gap-1.5 text-[11px] ml-1">
                                <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded">
                                    {stats.byValidity['valid'] || 0} valid
                                </span>

                                <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded">
                                    {(stats.byValidity['invalid'] || 0) + (stats.byValidity['tampered'] || 0)} invalid
                                </span>

                                <span className="px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">
                                    {stats.total} total
                                </span>
                            </div>
                        </div>

                        <ConnectBar />
                    </div>
                </div>
            </header>

            {/* Search + filter toggle row */}
            <div className="flex-shrink-0 border-b border-gray-800 bg-gray-950/60">
                <div className="max-w-[1800px] mx-auto px-6 py-2.5">
                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative flex-1 max-w-xl">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>

                            <input
                                type="text"
                                placeholder="Search fixtures..."
                                value={filters.search}
                                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-9 pr-4 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                        </div>

                        <button
                            onClick={() => setShowFilters(prev => !prev)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        >
                            <svg className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                            {hasActiveFilters && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            )}
                        </button>

                        <span className="text-[11px] text-gray-500">
                            {filtered.length === allFixtures.length
                                ? `${allFixtures.length} fixtures`
                                : `${filtered.length} / ${allFixtures.length}`}
                        </span>

                        {filtered.some(f => f.validity === 'valid') && (
                            <button
                                onClick={toggleAllFiltered}
                                className="px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            >
                                {filtered.filter(f => f.validity === 'valid').every(f => checkedIds.has(f.id))
                                    ? 'Deselect All'
                                    : 'Select All Valid'}
                            </button>
                        )}

                        <button
                            onClick={() => setShowNewFixture(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg transition-colors cursor-pointer ml-auto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            New Fixture
                        </button>
                    </div>
                </div>
            </div>

            {/* Collapsible filter chips */}
            {showFilters && (
                <div className="flex-shrink-0 border-b border-gray-800 bg-gray-950/40">
                    <div className="max-w-[1800px] mx-auto px-6 py-2.5">
                        <FilterBar
                            filters={filters}
                            onChange={setFilters}
                            fixtureCount={filtered.length}
                            totalCount={allFixtures.length}
                        />
                    </div>
                </div>
            )}

            {/* Main content — fills remaining height, columns scroll independently */}
            <div className="flex-1 flex min-h-0">
                {/* Fixture list — independent scroll */}
                <main
                    className={`flex-1 overflow-y-auto p-6 transition-all ${
                        selectedFixture ? 'max-w-[55%]' : ''
                    }`}
                >
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-sm">No fixtures match your filters.</p>
                            <button
                                onClick={() => setFilters(EMPTY_FILTERS)}
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer"
                            >
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div
                            className={`grid gap-3 ${
                                selectedFixture
                                    ? 'grid-cols-1'
                                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                            }`}
                        >
                            {filtered.map(fixture => (
                                <FixtureCard
                                    key={fixture.id}
                                    fixture={fixture}
                                    isSelected={fixture.id === selectedId}
                                    isChecked={checkedIds.has(fixture.id)}
                                    onToggleCheck={() => toggleChecked(fixture.id)}
                                    onClick={() =>
                                        setSelectedId(
                                            fixture.id === selectedId ? null : fixture.id
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </main>

                {/* Detail panel — independent scroll */}
                {selectedFixture && (
                    <aside className="w-[45%] flex-shrink-0 overflow-y-auto border-l border-gray-800">
                        <DetailPanel
                            fixture={selectedFixture}
                            onClose={() => setSelectedId(null)}
                        />
                    </aside>
                )}
            </div>

            <BulkActionBar
                selectedCount={checkedIds.size}
                onIssueAll={() => setShowBulkIssue(true)}
                onSendAll={() => setShowBulkSend(true)}
                onClearSelection={() => setCheckedIds(new Set())}
            />

            {showBulkIssue && checkedFixtures.length > 0 && (
                <IssuePanel
                    fixtures={checkedFixtures}
                    onClose={() => setShowBulkIssue(false)}
                />
            )}

            {showBulkSend && checkedFixtures.length > 0 && (
                <SendPanel
                    fixtures={checkedFixtures}
                    onClose={() => setShowBulkSend(false)}
                />
            )}

            {showNewFixture && (
                <NewFixturePanel
                    onClose={() => setShowNewFixture(false)}
                />
            )}
        </div>
    );
};

export const App: React.FC = () => (
    <WalletProvider>
        <AppInner />
    </WalletProvider>
);
