import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Loader2, Layers } from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';
import {
    useGlobalSkillFrameworks,
    useGlobalSemanticSearchSkills,
} from '../../../helpers/globalSkillFrameworks.helpers';
import useDebounce from '../../../hooks/useDebounce';
import CompetencyIcon from '../../SkillFrameworks/CompetencyIcon';
import { SkillLevel } from '../../skills/skillTypes';
import type { SelectedSkill } from '../../skills/skillTypes';
import type { SkillFrameworkNode } from '../../../components/boost/boost';
import type { ResolvedSkill } from './skillAlignment';
import {
    keyFor,
    normalizeName,
    dedupeByName,
    semanticRecordToNode,
    FrameworkDefaultsLoader,
    SkillChip,
} from './skillBrowserShared';
import { SkillBrowserModal } from './SkillBrowserModal';
import * as m from '../../../paraglide/messages.js';

interface SkillsSectionProps {
    selectedSkills: SelectedSkill[];
    resolvedSkills: ResolvedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    onResolvedSkillsChange: (resolved: ResolvedSkill[]) => void;
}

const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';
const SEARCH_DEBOUNCE_MS = 300;
const MAX_SUGGESTIONS = 8;

export const SkillsSection: React.FC<SkillsSectionProps> = ({
    selectedSkills,
    resolvedSkills,
    onSelectedSkillsChange,
    onResolvedSkillsChange,
}) => {
    const frameworks = useGlobalSkillFrameworks();
    const { newModal, closeModal } = useModal();
    const resolvedRef = useRef<Map<string, ResolvedSkill>>(new Map());

    // Always-latest selection, so add/remove handlers captured by the modal
    // (newModal snapshots props once) never append onto a stale array.
    const selectedSkillsRef = useRef(selectedSkills);
    useEffect(() => {
        selectedSkillsRef.current = selectedSkills;
    }, [selectedSkills]);

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
            const current = selectedSkillsRef.current;
            if (current.some(s => s.id === skill.id && s.frameworkId === frameworkId)) return;

            resolvedRef.current.set(keyFor(frameworkId, skill.id), {
                id: skill.id,
                frameworkId,
                targetName: skill.targetName,
                targetDescription: skill.targetDescription,
                targetCode: skill.targetCode,
                frameworkName: frameworkNameById.get(frameworkId),
                icon: skill.icon,
            });

            const next = [
                ...current,
                { id: skill.id, frameworkId, proficiency: proficiency ?? SkillLevel.Hidden },
            ];
            selectedSkillsRef.current = next;
            commitSkills(next);
        },
        [frameworkNameById, commitSkills]
    );

    const handleRemoveSkill = useCallback(
        (frameworkId: string, skillId: string) => {
            const next = selectedSkillsRef.current.filter(
                s => !(s.id === skillId && s.frameworkId === frameworkId)
            );
            selectedSkillsRef.current = next;
            commitSkills(next);
        },
        [commitSkills]
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

    const openBrowser = useCallback(() => {
        newModal(
            <SkillBrowserModal
                frameworks={frameworks}
                selectedSkills={selectedSkills}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                handleCloseModal={closeModal}
            />,
            {},
            { mobile: ModalTypes.BottomSheet, desktop: ModalTypes.FullScreen }
        );
    }, [newModal, closeModal, frameworks, selectedSkills, handleAddSkill, handleRemoveSkill]);

    return (
        <section className={`${CARD_CLASS} space-y-4`}>
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">
                    {m['issueFlow.skillsTitle']()}
                </h3>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    {m['issueFlow.skillsSubtitle']()}
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
                                aria-label={m['issueFlow.removeSkill']({ name: chip.name })}
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

            {hasQuery && semanticLoading ? (
                <div className="flex items-center gap-2 text-sm text-grayscale-500 py-1">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {m['issueFlow.searching']()}
                </div>
            ) : suggestions.length > 0 ? (
                <div className="space-y-2">
                    {!hasQuery && (
                        <p className="text-xs font-medium text-grayscale-500">
                            {m['issueFlow.suggested']()}
                        </p>
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
                <p className="text-sm text-grayscale-500 py-1">
                    {m['issueFlow.noMatchingSkills']()}
                </p>
            ) : null}

            <button
                type="button"
                onClick={openBrowser}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors"
            >
                <Layers className="w-4 h-4" />
                {m['issueFlow.browseAllFrameworks']()}
            </button>
        </section>
    );
};
