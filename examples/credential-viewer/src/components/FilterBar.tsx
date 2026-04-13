import React from 'react';

import {
    CREDENTIAL_SPECS,
    CREDENTIAL_PROFILES,
    FIXTURE_VALIDITIES,
    type CredentialSpec,
    type CredentialProfile,
    type FixtureValidity,
} from '@learncard/credential-library';

import { SPEC_LABELS, SPEC_COLORS, PROFILE_LABELS, VALIDITY_COLORS, CATEGORY_COLORS, DEFAULT_CATEGORY_COLOR } from '../lib/colors';
import { ALL_CATEGORIES, type CredentialCategory } from '../lib/category';

export interface Filters {
    specs: CredentialSpec[];
    profiles: CredentialProfile[];
    validity: FixtureValidity[];
    categories: CredentialCategory[];
    search: string;
}

interface FilterBarProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
    fixtureCount: number;
    totalCount: number;
}

const ToggleChip: React.FC<{
    label: string;
    active: boolean;
    onClick: () => void;
    bg?: string;
    text?: string;
}> = ({ label, active, onClick, bg, text }) => (
    <button
        onClick={onClick}
        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
            active
                ? `${bg || 'bg-blue-600'} ${text || 'text-white'} ring-1 ring-white/20`
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
        }`}
    >
        {label}
    </button>
);

const toggleItem = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

export const FilterBar: React.FC<FilterBarProps> = ({
    filters,
    onChange,
    fixtureCount,
    totalCount,
}) => {
    const hasFilters =
        filters.specs.length > 0 ||
        filters.profiles.length > 0 ||
        filters.validity.length > 0 ||
        filters.categories.length > 0 ||
        filters.search.length > 0;

    return (
        <div className="space-y-2">
            {/* Spec filters */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Spec</span>

                {CREDENTIAL_SPECS.map(spec => (
                    <ToggleChip
                        key={spec}
                        label={SPEC_LABELS[spec]}
                        active={filters.specs.includes(spec)}
                        onClick={() => onChange({ ...filters, specs: toggleItem(filters.specs, spec) })}
                        bg={SPEC_COLORS[spec].bg}
                        text={SPEC_COLORS[spec].text}
                    />
                ))}
            </div>

            {/* Profile filters */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Profile</span>

                {CREDENTIAL_PROFILES.map(profile => (
                    <ToggleChip
                        key={profile}
                        label={PROFILE_LABELS[profile]}
                        active={filters.profiles.includes(profile)}
                        onClick={() =>
                            onChange({ ...filters, profiles: toggleItem(filters.profiles, profile) })
                        }
                    />
                ))}
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Category</span>

                {ALL_CATEGORIES.map(cat => {
                    const color = CATEGORY_COLORS[cat] ?? DEFAULT_CATEGORY_COLOR;

                    return (
                        <ToggleChip
                            key={cat}
                            label={cat}
                            active={filters.categories.includes(cat)}
                            onClick={() =>
                                onChange({ ...filters, categories: toggleItem(filters.categories, cat) })
                            }
                            bg={color.bg}
                            text={color.text}
                        />
                    );
                })}
            </div>

            {/* Validity filters */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-medium w-14">Validity</span>

                {FIXTURE_VALIDITIES.map(v => (
                    <ToggleChip
                        key={v}
                        label={v.charAt(0).toUpperCase() + v.slice(1)}
                        active={filters.validity.includes(v)}
                        onClick={() =>
                            onChange({ ...filters, validity: toggleItem(filters.validity, v) })
                        }
                        bg={VALIDITY_COLORS[v].bg}
                        text={VALIDITY_COLORS[v].text}
                    />
                ))}
            </div>
        </div>
    );
};
