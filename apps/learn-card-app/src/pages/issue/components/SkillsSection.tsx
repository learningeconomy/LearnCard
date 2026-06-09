import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Plus, ChevronDown, Loader2 } from 'lucide-react';

import { useSearchFrameworkSkills } from 'learn-card-base';
import {
    useGlobalSkillFrameworks,
    useGlobalSemanticSearchSkills,
    type GlobalSkillFrameworkConfig,
    type SemanticSearchSkillRecord,
} from '../../../helpers/globalSkillFrameworks.helpers';
import {
    convertApiSkillNodeToSkillTreeNode,
    type ApiSkillNode,
} from '../../../helpers/skillFramework.helpers';
import useDebounce from '../../../hooks/useDebounce';
import CompetencyIcon from '../../SkillFrameworks/CompetencyIcon';
import SkillSearchSelector from '../../skills/SkillSearchSelector';
import { SkillLevel } from '../../skills/skillTypes';
import type { SelectedSkill } from '../../skills/skillTypes';
import type { SkillFrameworkNode } from '../../../components/boost/boost';
import type { ResolvedSkill } from './skillAlignment';

interface SkillsSectionProps {
    selectedSkills: SelectedSkill[];
    resolvedSkills: ResolvedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    onResolvedSkillsChange: (resolved: ResolvedSkill[]) => void;
}

const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 8;

const keyFor = (frameworkId: string, id: string) => `${frameworkId}::${id}`;
const normalizeName = (name?: string) => (name ?? '').trim().toLowerCase();

const dedupeByName = (nodes: SkillFrameworkNode[]): SkillFrameworkNode[] => {
    const seen = new Set<string>();
    const result: SkillFrameworkNode[] = [];
    for (const node of nodes) {
        const key = normalizeName(node.targetName);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        result.push(node);
    }
    return result;
};

const semanticRecordToNode = (record: SemanticSearchSkillRecord): SkillFrameworkNode =>
    ({
        id: record.id,
        frameworkId: record.frameworkId,
        targetFramework: record.targetFramework ?? record.frameworkId,
        targetName: record.targetName ?? '',
        icon: record.icon,
    } as SkillFrameworkNode);

const FrameworkDefaultsLoader: React.FC<{
    framework: GlobalSkillFrameworkConfig;
    onLoaded: (frameworkId: string, nodes: SkillFrameworkNode[]) => void;
}> = ({ framework, onLoaded }) => {
    const ids = framework.defaultSkillIds ?? [];
    const { data } = useSearchFrameworkSkills(
        framework.frameworkId,
        { id: { $in: ids } },
        { enabled: ids.length > 0 }
    );

    useEffect(() => {
        const records = (data as { records?: ApiSkillNode[] } | undefined)?.records ?? [];
        onLoaded(
            framework.frameworkId,
            records.map(record => convertApiSkillNodeToSkillTreeNode(record))
        );
    }, [data, framework.frameworkId, onLoaded]);

    return null;
};

const SkillChip: React.FC<{ label: string; icon?: string; onClick: () => void }> = ({
    label,
    icon,
    onClick,
}) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 py-1.5 pl-2 pr-3 rounded-full border border-grayscale-300 text-sm text-grayscale-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
    >
        <CompetencyIcon icon={icon} size="x-small" />
        <Plus className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate max-w-[200px]">{label}</span>
    </button>
);

export const SkillsSection: React.FC<SkillsSectionProps> = ({
    selectedSkills,
    resolvedSkills,
    onSelectedSkillsChange,
    onResolvedSkillsChange,
}) => {
    const frameworks = useGlobalSkillFrameworks();
    const resolvedRef = useRef<Map<string, ResolvedSkill>>(new Map());

    useEffect(() => {
        resolvedSkills.forEach(r => resolvedRef.current.set(keyFor(r.frameworkId, r.id), r));
    }, [resolvedSkills]);

    const resolvedByKey = useMemo(() => {
        const map = new Map<string, ResolvedSkill>();
        resolvedSkills.forEach(r => map.set(keyFor(r.frameworkId, r.id), r));
        return map;
    }, [resolvedSkills]);

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [browsing, setBrowsing] = useState(false);
    const [defaultsByFramework, setDefaultsByFramework] = useState<
        Record<string, SkillFrameworkNode[]>
    >({});

    const frameworkIds = useMemo(() => frameworks.map(f => f.frameworkId), [frameworks]);
    const frameworkNameById = useMemo(() => {
        const map = new Map<string, string>();
        frameworks.forEach(f => map.set(f.frameworkId, f.name));
        return map;
    }, [frameworks]);

    const updateDebounced = useDebounce(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    useEffect(() => {
        updateDebounced();
        return () => updateDebounced.cancel?.();
    }, [query, updateDebounced]);

    const { data: semanticData, isLoading: semanticLoading } = useGlobalSemanticSearchSkills(
        debouncedQuery,
        frameworkIds,
        { limit: 12 }
    );

    const emitResolved = useCallback(
        (skills: SelectedSkill[]) => {
            const resolved = skills
                .map(s => resolvedRef.current.get(keyFor(s.frameworkId, s.id)))
                .filter((r): r is ResolvedSkill => Boolean(r));
            onResolvedSkillsChange(resolved);
        },
        [onResolvedSkillsChange]
    );

    const commitSkills = useCallback(
        (skills: SelectedSkill[]) => {
            onSelectedSkillsChange(skills);
            emitResolved(skills);
        },
        [onSelectedSkillsChange, emitResolved]
    );

    const handleAddSkill = useCallback(
        (skill: SkillFrameworkNode, proficiency: SkillLevel = SkillLevel.Hidden) => {
            const frameworkId = skill.frameworkId ?? skill.targetFramework ?? '';
            if (!frameworkId || !skill.id) return;
            if (selectedSkills.some(s => s.id === skill.id && s.frameworkId === frameworkId))
                return;

            resolvedRef.current.set(keyFor(frameworkId, skill.id), {
                id: skill.id,
                frameworkId,
                targetName: skill.targetName,
                targetDescription: skill.targetDescription,
                targetCode: skill.targetCode,
                frameworkName: frameworkNameById.get(frameworkId),
                icon: skill.icon,
            });

            commitSkills([
                ...selectedSkills,
                { id: skill.id, frameworkId, proficiency: proficiency ?? SkillLevel.Hidden },
            ]);
        },
        [selectedSkills, frameworkNameById, commitSkills]
    );

    const handleRemoveSkill = useCallback(
        (frameworkId: string, skillId: string) => {
            commitSkills(
                selectedSkills.filter(s => !(s.id === skillId && s.frameworkId === frameworkId))
            );
        },
        [selectedSkills, commitSkills]
    );

    const handleDefaultsLoaded = useCallback((frameworkId: string, nodes: SkillFrameworkNode[]) => {
        setDefaultsByFramework(prev => {
            if (prev[frameworkId]?.length === nodes.length) return prev;
            return { ...prev, [frameworkId]: nodes };
        });
    }, []);

    const selectedKeys = useMemo(
        () => new Set(selectedSkills.map(s => keyFor(s.frameworkId, s.id))),
        [selectedSkills]
    );
    const selectedNames = useMemo(() => {
        const names = new Set<string>();
        selectedSkills.forEach(s => {
            const key = keyFor(s.frameworkId, s.id);
            const resolved = resolvedByKey.get(key) ?? resolvedRef.current.get(key);
            if (resolved?.targetName) names.add(normalizeName(resolved.targetName));
        });
        return names;
    }, [selectedSkills, resolvedByKey]);

    const isUnselected = useCallback(
        (node: SkillFrameworkNode) => {
            const frameworkId = node.frameworkId ?? node.targetFramework ?? '';
            if (selectedKeys.has(keyFor(frameworkId, node.id ?? ''))) return false;
            return !selectedNames.has(normalizeName(node.targetName));
        },
        [selectedKeys, selectedNames]
    );

    const hasQuery = Boolean(debouncedQuery.trim());

    const suggestions = useMemo(() => {
        const source = hasQuery
            ? (semanticData?.records ?? []).map(semanticRecordToNode)
            : Object.values(defaultsByFramework).flat();
        return dedupeByName(source.filter(isUnselected)).slice(0, MAX_SUGGESTIONS);
    }, [hasQuery, semanticData, defaultsByFramework, isUnselected]);

    const selectedChips = useMemo(
        () =>
            selectedSkills.map(s => {
                const key = keyFor(s.frameworkId, s.id);
                const resolved = resolvedByKey.get(key) ?? resolvedRef.current.get(key);
                return {
                    ...s,
                    name: resolved?.targetName ?? s.id,
                    icon: resolved?.icon,
                    frameworkName: resolved?.frameworkName ?? frameworkNameById.get(s.frameworkId),
                };
            }),
        [selectedSkills, resolvedByKey, frameworkNameById]
    );

    return (
        <section className={`${CARD_CLASS} space-y-4`}>
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">Skills</h3>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    Search competencies to align this credential to a framework.
                </p>
            </div>

            {!hasQuery &&
                frameworks.map(framework => (
                    <FrameworkDefaultsLoader
                        key={framework.frameworkId}
                        framework={framework}
                        onLoaded={handleDefaultsLoaded}
                    />
                ))}

            {selectedChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedChips.map(chip => (
                        <span
                            key={keyFor(chip.frameworkId, chip.id)}
                            className="flex items-center gap-1.5 py-1.5 pl-2 pr-3 rounded-full bg-grayscale-900 text-white text-sm"
                        >
                            <CompetencyIcon icon={chip.icon} size="x-small" />
                            <span className="flex items-baseline gap-1.5 min-w-0">
                                <span className="truncate max-w-[180px]">{chip.name}</span>
                                {chip.frameworkName && (
                                    <span className="text-[11px] text-white/50 truncate max-w-[110px]">
                                        {chip.frameworkName}
                                    </span>
                                )}
                            </span>
                            <button
                                type="button"
                                onClick={() => handleRemoveSkill(chip.frameworkId, chip.id)}
                                className="text-white/70 hover:text-white transition-colors shrink-0"
                                aria-label={`Remove ${chip.name}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayscale-400" />
                <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by skill, goal, or job…"
                    className="w-full py-3 pl-10 pr-10 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-400 hover:text-grayscale-700 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {hasQuery && semanticLoading ? (
                <div className="flex items-center gap-2 text-sm text-grayscale-500 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching…
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                    {!hasQuery && (
                        <p className="text-xs font-medium text-grayscale-500">Suggested</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map(node => (
                            <SkillChip
                                key={keyFor(
                                    node.frameworkId ?? node.targetFramework ?? '',
                                    node.id ?? ''
                                )}
                                label={node.targetName ?? ''}
                                icon={node.icon}
                                onClick={() => handleAddSkill(node)}
                            />
                        ))}
                    </div>
                </div>
            ) : hasQuery ? (
                <p className="text-sm text-grayscale-500 py-1">No matching skills.</p>
            ) : null}

            <button
                type="button"
                onClick={() => setBrowsing(prev => !prev)}
                className="flex items-center gap-1.5 text-sm font-medium text-grayscale-700 hover:text-grayscale-900 transition-colors"
            >
                Browse all frameworks
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${browsing ? 'rotate-180' : ''}`}
                />
            </button>

            {browsing && (
                <div className="pt-2 border-t border-grayscale-200">
                    <SkillSearchSelector
                        selectedSkills={selectedSkills}
                        onSelectedSkillsChange={commitSkills}
                        onAddSkill={handleAddSkill}
                        onRemoveSkill={handleRemoveSkill}
                        searchQuery={query}
                        onSearchQueryChange={setQuery}
                        showSearchInput={false}
                        showSelectedSkills={false}
                        showSuggestSkill
                    />
                </div>
            )}
        </section>
    );
};
