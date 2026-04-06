import React, { useState, useEffect, useMemo } from 'react';
import { useFlags } from 'launchdarkly-react-client-sdk';

import { IonInput } from '@ionic/react';
import ExplorePathwaysModal from '../ExplorePathwaysModal';

import {
    useModal,
    ModalTypes,
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
};

const PathwaySearchInput: React.FC<PathwaySearchInputProps> = ({
    placeholder = 'Choose a skill, goal, or job...',
}) => {
    const { newModal } = useModal();
    const { getIconSet } = useTheme();
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId as string;

    const [value, setValue] = useState('');
    const [debouncedValue, setDebouncedValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const PathwayDecoration = iconSet[CredentialCategoryEnum.aiPathway] as React.ComponentType<{
        className?: string;
    }>;
    const SkillDecoration = iconSet[CredentialCategoryEnum.skill] as React.ComponentType<{
        className?: string;
    }>;

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), 300);
        return () => clearTimeout(timer);
    }, [value]);

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

    const openModal = (initialQuery: string) => {
        newModal(<ExplorePathwaysModal initialSearchQuery={initialQuery} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const handleSelectSuggestion = (title: string) => {
        setValue(title);
        setShowSuggestions(false);
        openModal(title);
    };

    return (
        <div className="relative flex flex-col">
            <div className="relative flex items-center">
                <PathwayDecoration className="absolute left-3 w-[24px] h-[24px] text-teal-100 pointer-events-none z-10" />
                <IonInput
                    value={value}
                    onIonInput={(e: any) => {
                        setValue(e.detail.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onKeyDown={(e: any) => {
                        if (e.key === 'Enter') openModal(value);
                        if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    autocapitalize="off"
                    className="w-full bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium text-sm"
                    style={{ '--padding-start': '44px' } as any}
                    placeholder={placeholder}
                    type="text"
                />
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white rounded-xl shadow-lg mt-1 overflow-hidden border border-grayscale-200">
                    {suggestions.map(suggestion => (
                        <button
                            key={suggestion.key}
                            onMouseDown={() => handleSelectSuggestion(suggestion.title)}
                            className="w-full flex items-center gap-3 px-4 py-[11px] text-sm text-grayscale-800 font-medium hover:bg-teal-50 border-b border-grayscale-100 last:border-b-0 transition-colors"
                        >
                            {suggestion.kind === 'role' ? (
                                <PathwayDecoration className="w-[22px] h-[22px] shrink-0 text-grayscale-700" />
                            ) : (
                                <SkillDecoration className="w-[22px] h-[22px] shrink-0 text-grayscale-700" />
                            )}
                            <span className="flex-1 text-left text-grayscale-900 font-semibold text-[14px]">
                                {suggestion.title}
                            </span>
                            <span className="text-[10px] font-bold tracking-widest text-grayscale-400 uppercase">
                                {suggestion.kind === 'role' ? 'ROLE' : 'SKILL'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PathwaySearchInput;
