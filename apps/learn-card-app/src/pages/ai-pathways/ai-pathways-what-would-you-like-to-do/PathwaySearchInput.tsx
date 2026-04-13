import React, { useState, useEffect, useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonInput } from '@ionic/react';
import { ArrowRight, X } from 'lucide-react';
import {
    CredentialCategoryEnum,
    useSemanticSearchSkills,
    useOccupationSuggestionsForKeyword,
} from 'learn-card-base';
import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons/index';
import type { OccupationDetailsResponse } from 'learn-card-base';

import type { ApiSkillNode } from '../../../helpers/skillFramework.helpers';

type SemanticSkillRecord = ApiSkillNode & { score?: number };

type SuggestionItem =
    | { kind: 'role'; title: string; key: string }
    | { kind: 'skill'; title: string; key: string };

type PathwaySearchInputProps = {
    placeholder?: string;
    value?: string;
    onValueChange?: (value: string) => void;
    onSearchSubmit?: (query: string) => void;
    variant?: 'action' | 'simple';
};

const PathwaySearchInput: React.FC<PathwaySearchInputProps> = ({
    placeholder = 'Choose a skill, goal, or job...',
    value,
    onValueChange,
    onSearchSubmit,
    variant = 'action',
}) => {
    const { getIconSet } = useTheme();
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId as string;

    const [internalValue, setInternalValue] = useState<string>('');
    const [debouncedValue, setDebouncedValue] = useState<string>('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const searchValue = value ?? internalValue;
    const [committedQuery, setCommittedQuery] = useState<string>((value ?? '').trim());
    const [didUserType, setDidUserType] = useState(false);

    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const PathwayDecoration = iconSet[CredentialCategoryEnum.aiPathway] as React.ComponentType<{
        className?: string;
    }>;
    const SkillDecoration = iconSet[CredentialCategoryEnum.skill] as React.ComponentType<{
        className?: string;
    }>;
    const ExperiencesDecoration = iconSet[
        CredentialCategoryEnum.workHistory
    ] as React.ComponentType<{
        className?: string;
    }>;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(searchValue), 300);
        return () => clearTimeout(timer);
    }, [searchValue]);

    useEffect(() => {
        const trimmedValue = (value ?? '').trim();
        if (!didUserType && !committedQuery && trimmedValue) {
            setCommittedQuery(trimmedValue);
        }
    }, [value, didUserType, committedQuery]);

    const { data: occupationSuggestions } = useOccupationSuggestionsForKeyword(debouncedValue);
    const { data: skillSearchData } = useSemanticSearchSkills(debouncedValue, frameworkId, {
        limit: 10,
    });

    const suggestions = useMemo<SuggestionItem[]>(() => {
        const roles: SuggestionItem[] = (
            (occupationSuggestions ?? []) as OccupationDetailsResponse[]
        )
            .slice(0, 5)
            .map(occ => ({ kind: 'role' as const, title: occ.OnetTitle, key: occ.OnetCode }));

        const skills: SuggestionItem[] = ((skillSearchData?.records ?? []) as SemanticSkillRecord[])
            .slice(0, 5)
            .map(s => ({ kind: 'skill' as const, title: s.statement, key: s.id }));

        const result: SuggestionItem[] = [];
        const maxLen = Math.max(roles.length, skills.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < roles.length) result.push(roles[i]);
            if (i < skills.length) result.push(skills[i]);
        }
        return result.slice(0, 8);
    }, [occupationSuggestions, skillSearchData]);

    const updateSearchValue = (nextValue: string) => {
        setInternalValue(nextValue);
        onValueChange?.(nextValue);
    };

    const submitSearch = (query: string) => {
        onSearchSubmit?.(query);
    };

    const handleSelectSuggestion = (title: string) => {
        updateSearchValue(title);
        setShowSuggestions(false);
        setCommittedQuery(title.trim());
        submitSearch(title);
    };

    const clearSearch = () => {
        updateSearchValue('');
        setDebouncedValue('');
        setShowSuggestions(false);
        setCommittedQuery('');
        submitSearch('');
    };

    const trimmedSearchValue = searchValue.trim();
    const isSimpleVariant = variant === 'simple';
    const showClearAction = Boolean(committedQuery) && committedQuery === trimmedSearchValue;

    return (
        <div className="relative flex flex-col">
            <div className={`flex items-center ${isSimpleVariant ? '' : 'gap-3'}`}>
                <div className="relative flex-1">
                    <PathwayDecoration className="absolute left-[10px] w-[35px] h-[35px] text-teal-100 pointer-events-none z-10 top-1/2 -translate-y-1/2" />
                    <IonInput
                        value={searchValue}
                        onIonInput={(e: any) => {
                            const nextValue = e.detail.value ?? '';
                            updateSearchValue(nextValue);
                            setShowSuggestions(Boolean(nextValue));
                            setDidUserType(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        onKeyDown={(e: any) => {
                            if (e.key === 'Escape') setShowSuggestions(false);
                        }}
                        autocapitalize="off"
                        className={`w-full text-grayscale-800 rounded-[20px] !px-[10px] !py-0 font-medium text-[16px] leading-[18px] ${
                            showClearAction ? 'bg-violet-50' : 'bg-grayscale-100'
                        }`}
                        style={
                            {
                                '--padding-start': '45px',
                                '--padding-end': isSimpleVariant ? '44px' : '16px',
                            } as React.CSSProperties
                        }
                        placeholder={placeholder}
                        type="text"
                    />

                    {isSimpleVariant && trimmedSearchValue && (
                        <button
                            type="button"
                            aria-label="Clear search"
                            onMouseDown={e => e.preventDefault()}
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}

                    {showSuggestions && suggestions.length > 0 && (
                        <div
                            className="absolute top-full left-0 right-0 z-50 rounded-xl shadow-lg mt-1 overflow-hidden border border-grayscale-200"
                            style={{
                                background: 'rgba(255, 255, 255, 0.64)',
                                backdropFilter: 'blur(8.154845237731934px)',
                                WebkitBackdropFilter: 'blur(8.154845237731934px)',
                            }}
                        >
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion.key}
                                    onMouseDown={() => handleSelectSuggestion(suggestion.title)}
                                    className="relative w-full flex items-center gap-3 px-4 py-[11px] text-sm text-grayscale-800 font-medium hover:bg-teal-50 transition-colors"
                                >
                                    {suggestion.kind === 'role' ? (
                                        <ExperiencesDecoration className="w-[22px] h-[22px] shrink-0 text-grayscale-700" />
                                    ) : (
                                        <SkillDecoration className="w-[22px] h-[22px] shrink-0 text-grayscale-700" />
                                    )}
                                    <span className="flex-1 text-left text-grayscale-900 font-semibold text-[14px]">
                                        {suggestion.title}
                                    </span>
                                    <span className="text-xs font-bold tracking-widest text-grayscale-600 uppercase">
                                        {suggestion.kind === 'role' ? 'ROLE' : 'SKILL'}
                                    </span>
                                    {index < suggestions.length - 1 && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute bottom-0 left-4 right-4 h-px bg-grayscale-300"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {!isSimpleVariant && (
                    <button
                        type="button"
                        aria-label={showClearAction ? 'Clear search' : 'Search'}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                            if (showClearAction) {
                                clearSearch();
                                return;
                            }
                            if (!trimmedSearchValue) return;
                            setCommittedQuery(trimmedSearchValue);
                            submitSearch(trimmedSearchValue);
                        }}
                        className={`px-[20px] py-[10px] rounded-full text-grayscale-600 hover:text-grayscale-800 transition-colors flex items-center justify-center ${
                            showClearAction || !trimmedSearchValue
                                ? 'bg-grayscale-100'
                                : 'bg-[linear-gradient(90deg,#14B8A6_0%,#2DD4BF_98.7%)]'
                        }`}
                    >
                        {showClearAction ? (
                            <X className="w-[24px] h-[24px]" />
                        ) : (
                            <ArrowRight
                                className={`w-[24px] h-[24px] ${
                                    !trimmedSearchValue ? 'text-grayscale-400' : 'text-white'
                                }`}
                            />
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default PathwaySearchInput;
