import React, { useState } from 'react';
import { IonInput } from '@ionic/react';
import { Checkmark } from '@learncard/react';
import { OBV3_ACHIEVEMENT_TYPES } from '../../../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { CATEGORY_MAP } from 'learn-card-base/helpers/credentialHelpers';
import {
    isCustomBoostType,
    getAchievementTypeFromCustomType,
    getCategoryTypeFromCustomType,
    replaceUnderscoresWithWhiteSpace,
} from 'learn-card-base/helpers/boostCustomTypeHelpers';

const LOWERCASE_WORDS = new Set(['of', 'and', 'the', 'in', 'for', 'or', 'a', 'an']);

/** Map internal CATEGORY_MAP values to user-facing wallet section labels */
const CATEGORY_DISPLAY_LABELS: Record<string, string> = {
    'Work History': 'Experiences',
    'Learning History': 'Studies',
    'Achievement': 'Achievements',
    'Social Badge': 'Boosts',
    'ID': 'IDs',
    'Membership': 'Membership',
};

/** Convert PascalCase to readable text (e.g. "CertificateOfCompletion" → "Certificate of Completion") */
const formatPascalCase = (type: string): string => {
    return type
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .split(' ')
        .map((word, i) => {
            const lower = word.toLowerCase();
            if (i > 0 && LOWERCASE_WORDS.has(lower)) return lower;
            return word;
        })
        .join(' ');
};

/** Format any achievement type to readable text, handling custom types and ext: prefixes */
export const formatAchievementType = (type: string): string => {
    if (isCustomBoostType(type)) {
        const raw = getAchievementTypeFromCustomType(type);
        return raw ? replaceUnderscoresWithWhiteSpace(raw) : type;
    }
    if (type.startsWith('ext:')) {
        return formatPascalCase(type.slice(4));
    }
    return formatPascalCase(type);
};

/** Map a raw internal category value (e.g. "Work History") to its display label (e.g. "Experiences") */
export const getCategoryDisplayLabel = (internal: string): string =>
    CATEGORY_DISPLAY_LABELS[internal] || internal;

/** Get the user-facing wallet category label for an achievement type */
export const getWalletCategory = (type: string): string => {
    let internal: string;
    if (isCustomBoostType(type)) {
        internal = getCategoryTypeFromCustomType(type) || '';
    } else {
        internal = (CATEGORY_MAP as Record<string, string>)[type] || '';
    }
    return CATEGORY_DISPLAY_LABELS[internal] || internal;
};

type AchievementTypeEntry = {
    value: string;
    label: string;
    category: string;
};

/** Extended types for common experience/work categories not in OBv3 spec */
const EXTENDED_TYPES: { value: string; label: string }[] = [
    { value: 'ext:Job', label: 'Job' },
    { value: 'ext:Internship', label: 'Internship' },
    { value: 'ext:Volunteering', label: 'Volunteering' },
    { value: 'ext:Freelance', label: 'Freelance' },
    { value: 'ext:Club', label: 'Club' },
    { value: 'ext:Board', label: 'Board' },
    { value: 'ext:Conference', label: 'Conference' },
    { value: 'ext:SportsTeam', label: 'Sports Team' },
    { value: 'ext:ResearchProject', label: 'Research Project' },
    { value: 'ext:Workshop', label: 'Workshop' },
    { value: 'ext:Bootcamp', label: 'Bootcamp' },
    { value: 'ext:Training', label: 'Training' },
];

const ACHIEVEMENT_ENTRIES: AchievementTypeEntry[] = [
    // Standard OBv3 types
    ...OBV3_ACHIEVEMENT_TYPES.map(type => ({
        value: type,
        label: formatAchievementType(type),
        category: getWalletCategory(type),
    })),
    // Extended types (work/experience, learning, etc.)
    ...EXTENDED_TYPES.map(({ value, label }) => ({
        value,
        label,
        category: getWalletCategory(value),
    })),
];

export type AchievementTypeSelectorModalProps = {
    selected?: string;
    onSelect: (type: string) => void;
};

const AchievementTypeSelectorModal: React.FC<AchievementTypeSelectorModalProps> = ({
    selected,
    onSelect,
}) => {
    const [query, setQuery] = useState('');

    const filtered = ACHIEVEMENT_ENTRIES.filter(
        entry =>
            entry.label.toLowerCase().includes(query.toLowerCase()) ||
            entry.category.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="w-full h-full transparent flex items-center justify-center">
            <div className="bg-white text-grayscale-800 w-full rounded-[20px] shadow-3xl z-50 font-notoSans max-w-[600px] h-[600px] max-h-[85vh] flex flex-col">
                <div className="px-4 py-3 border-b border-grayscale-100">
                    <h2 className="font-notoSans font-semibold text-[16px] normal-case">
                        Select Achievement Type
                    </h2>
                </div>
                <div className="p-4">
                    <IonInput
                        type="text"
                        value={query}
                        placeholder="Search achievement types..."
                        onIonInput={e => setQuery(e.detail.value ?? '')}
                        className="bg-grayscale-100 text-grayscale-800 rounded-[12px] !py-[5px] font-normal text-base !pl-[15px]"
                    />
                </div>
                <div className="px-2 pb-4 overflow-y-auto flex-1">
                    {filtered.map(entry => (
                        <button
                            key={entry.value}
                            onClick={() => onSelect(entry.value)}
                            className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-grayscale-100 flex items-center justify-between"
                        >
                            <div className="flex flex-col">
                                <span className="text-grayscale-800 text-[15px]">
                                    {entry.label}
                                </span>
                                {entry.category && (
                                    <span className="text-grayscale-500 text-[12px]">
                                        {entry.category}
                                    </span>
                                )}
                            </div>
                            {selected === entry.value && (
                                <Checkmark className="w-[20px] h-[20px] text-emerald-600" />
                            )}
                        </button>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-center text-grayscale-400 text-sm py-4">
                            No matching types found
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AchievementTypeSelectorModal;
