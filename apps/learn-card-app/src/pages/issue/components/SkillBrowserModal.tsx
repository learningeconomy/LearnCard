import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Check, Plus, Loader2 } from 'lucide-react';

import CompetencyIcon from '../../SkillFrameworks/CompetencyIcon';
import {
    useGlobalSemanticSearchSkills,
    type GlobalSkillFrameworkConfig,
} from '../../../helpers/globalSkillFrameworks.helpers';
import useDebounce from '../../../hooks/useDebounce';
import type { SkillFrameworkNode } from '../../../components/boost/boost';
import type { SelectedSkill } from '../../skills/skillTypes';
import {
    keyFor,
    nodeFrameworkId,
    dedupeByName,
    semanticRecordToNode,
    FrameworkDefaultsLoader,
} from './skillBrowserShared';
import * as m from '../../../paraglide/messages.js';

const SEARCH_DEBOUNCE_MS = 300;

interface SkillBrowserModalProps {
    frameworks: GlobalSkillFrameworkConfig[];
    selectedSkills: SelectedSkill[];
    onAddSkill: (skill: SkillFrameworkNode) => void;
    onRemoveSkill: (frameworkId: string, skillId: string) => void;
    handleCloseModal: () => void;
}

const SelectablePill: React.FC<{
    node: SkillFrameworkNode;
    selected: boolean;
    onToggle: () => void;
}> = ({ node, selected, onToggle }) => (
    <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-1.5 py-1.5 pl-2 pr-3 rounded-full text-sm transition-colors ${
            selected
                ? 'bg-grayscale-900 text-white'
                : 'border border-grayscale-300 text-grayscale-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700'
        }`}
    >
        <CompetencyIcon icon={node.icon} size="x-small" />
        {selected ? (
            <Check className="w-3.5 h-3.5 shrink-0" />
        ) : (
            <Plus className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate max-w-[200px]">{node.targetName}</span>
    </button>
);

export const SkillBrowserModal: React.FC<SkillBrowserModalProps> = ({
    frameworks,
    selectedSkills,
    onAddSkill,
    onRemoveSkill,
    handleCloseModal,
}) => {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [defaultsByFramework, setDefaultsByFramework] = useState<
        Record<string, SkillFrameworkNode[]>
    >({});

    const frameworkIds = useMemo(() => frameworks.map(f => f.frameworkId), [frameworks]);

    const updateDebounced = useDebounce(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    useEffect(() => {
        updateDebounced();
        return () => updateDebounced.cancel?.();
    }, [query, updateDebounced]);

    const { data: semanticData, isLoading } = useGlobalSemanticSearchSkills(
        debouncedQuery,
        frameworkIds,
        { limit: 24 }
    );

    const handleDefaultsLoaded = useCallback((frameworkId: string, nodes: SkillFrameworkNode[]) => {
        setDefaultsByFramework(prev =>
            prev[frameworkId]?.length === nodes.length ? prev : { ...prev, [frameworkId]: nodes }
        );
    }, []);

    // Self-managed so live toggles render correctly — `newModal` captures props
    // once, so reading the parent's `selectedSkills` would go stale.
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
        () => new Set(selectedSkills.map(s => keyFor(s.frameworkId, s.id)))
    );

    const isSelected = useCallback(
        (node: SkillFrameworkNode) =>
            selectedKeys.has(keyFor(nodeFrameworkId(node), node.id ?? '')),
        [selectedKeys]
    );

    const toggle = useCallback(
        (node: SkillFrameworkNode) => {
            const frameworkId = nodeFrameworkId(node);
            if (!frameworkId || !node.id) return;
            const key = keyFor(frameworkId, node.id);
            setSelectedKeys(prev => {
                const next = new Set(prev);
                if (next.has(key)) {
                    next.delete(key);
                    onRemoveSkill(frameworkId, node.id!);
                } else {
                    next.add(key);
                    onAddSkill(node);
                }
                return next;
            });
        },
        [onAddSkill, onRemoveSkill]
    );

    const hasQuery = Boolean(debouncedQuery.trim());

    const searchResults = useMemo(
        () => dedupeByName((semanticData?.records ?? []).map(semanticRecordToNode)),
        [semanticData]
    );

    return (
        <div
            className="font-poppins w-full max-w-[560px] mx-auto bg-white rounded-[20px] flex flex-col max-h-[85vh] overflow-hidden"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            {!hasQuery &&
                frameworks.map(framework => (
                    <FrameworkDefaultsLoader
                        key={framework.frameworkId}
                        framework={framework}
                        onLoaded={handleDefaultsLoaded}
                    />
                ))}

            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-grayscale-100">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-semibold text-grayscale-900">
                        {m['issueFlow.addSkills']()}
                    </h2>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-grayscale-400 hover:text-grayscale-900 hover:bg-grayscale-100 transition-colors"
                        aria-label={m['common.close']()}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-sm text-grayscale-600 mb-4">
                    {selectedKeys.size > 0
                        ? m['issueFlow.selectedTapToToggle']({ count: selectedKeys.size })
                        : m['issueFlow.addSkillsSubtitle']()}
                </p>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={m['skills.search.searchPlaceholder']()}
                        className="w-full py-3 pl-10 pr-10 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                            aria-label={m['issueFlow.clearSearch']()}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-y-auto px-6 py-5 space-y-5">
                {hasQuery ? (
                    isLoading ? (
                        <div className="flex items-center gap-2 text-sm text-grayscale-500 py-1">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {m['issueFlow.searching']()}
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {searchResults.map(node => (
                                <SelectablePill
                                    key={keyFor(nodeFrameworkId(node), node.id ?? '')}
                                    node={node}
                                    selected={isSelected(node)}
                                    onToggle={() => toggle(node)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-grayscale-500 py-1">
                            {m['issueFlow.noMatchingSkills']()}
                        </p>
                    )
                ) : (
                    frameworks.map(framework => {
                        const nodes = dedupeByName(
                            defaultsByFramework[framework.frameworkId] ?? []
                        );
                        if (nodes.length === 0) return null;
                        return (
                            <div key={framework.frameworkId} className="space-y-2">
                                <p className="text-xs font-medium text-grayscale-500">
                                    {framework.name}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {nodes.map(node => (
                                        <SelectablePill
                                            key={keyFor(nodeFrameworkId(node), node.id ?? '')}
                                            node={node}
                                            selected={isSelected(node)}
                                            onToggle={() => toggle(node)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-grayscale-100">
                <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    {m['common.done']()}
                </button>
            </div>
        </div>
    );
};
