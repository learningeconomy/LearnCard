import React, { useState } from 'react';
import { useTheme } from '../../../../theme/hooks/useTheme';
import { OBV3_ACHIEVEMENT_TYPES } from '../../../../pages/appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { ParsedCredential } from './CheckListCredentialReviewStep';

type Props = {
    credential: ParsedCredential;
    onSave: (editedVc: any) => void;
    onBack: () => void;
};

/** Read a nested VC path, returning '' for missing values. Handles array values (e.g. achievementType: ["Certificate"]) */
const getField = (vc: any, path: string): string => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], vc);
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0];
    return '';
};

/** Return the tags array or [] */
const getTags = (vc: any): string[] => {
    return Array.isArray(vc?.credentialSubject?.achievement?.tag)
        ? vc.credentialSubject.achievement.tag
        : [];
};

/** Set a nested path on a deep-cloned VC. Empty string removes the key. */
const setField = (vc: any, path: string, value: string): any => {
    const clone = JSON.parse(JSON.stringify(vc));
    const keys = path.split('.');
    let obj = clone;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }
    const lastKey = keys[keys.length - 1];
    if (value === '') {
        delete obj[lastKey];
    } else {
        obj[lastKey] = value;
    }
    return clone;
};

export const CredentialEditView: React.FC<Props> = ({ credential, onSave, onBack }) => {
    const [vc, setVc] = useState<any>(() => JSON.parse(JSON.stringify(credential.vc)));
    const [tagInput, setTagInput] = useState('');
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const name = getField(vc, 'credentialSubject.achievement.name');

    const updateField = (path: string, value: string) => {
        setVc((prev: any) => {
            let updated = setField(prev, path, value);
            // Sync top-level name from achievement name (card display reads vc.name)
            if (path === 'credentialSubject.achievement.name') {
                updated = setField(updated, 'name', value);
            }
            return updated;
        });
    };

    /** Convert ISO datetime to YYYY-MM-DD for date input */
    const toDateInputValue = (isoString: string): string => {
        if (!isoString) return '';
        return isoString.slice(0, 10);
    };

    /** Convert YYYY-MM-DD from date input to ISO 8601 */
    const fromDateInputValue = (dateStr: string): string => {
        if (!dateStr) return '';
        return `${dateStr}T00:00:00.000Z`;
    };

    return (
        <div className="w-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-grayscale-100">
                    <svg className="w-5 h-5 text-grayscale-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h4 className="text-lg text-grayscale-900 font-notoSans font-semibold truncate">
                    {name || 'Edit Credential'}
                </h4>
            </div>

            {/* Form */}
            <div className="w-full bg-white shadow-button-bottom px-6 pt-4 pb-6 rounded-[15px] space-y-4">
                {/* Credential Name */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Credential Name
                    </label>
                    <input
                        type="text"
                        value={getField(vc, 'credentialSubject.achievement.name')}
                        onChange={e => updateField('credentialSubject.achievement.name', e.target.value)}
                        placeholder="e.g. Software Engineer at Acme Corp"
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Description
                    </label>
                    <textarea
                        rows={3}
                        value={getField(vc, 'credentialSubject.achievement.description')}
                        onChange={e => updateField('credentialSubject.achievement.description', e.target.value)}
                        placeholder="Add a description..."
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400 resize-y"
                    />
                </div>

                {/* Achievement Type */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Achievement Type
                    </label>
                    <select
                        value={getField(vc, 'credentialSubject.achievement.achievementType')}
                        onChange={e => updateField('credentialSubject.achievement.achievementType', e.target.value)}
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400 bg-white"
                    >
                        <option value="">Select type...</option>
                        {OBV3_ACHIEVEMENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Role */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Role
                    </label>
                    <input
                        type="text"
                        value={getField(vc, 'credentialSubject.role')}
                        onChange={e => updateField('credentialSubject.role', e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>

                {/* Dates */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityStartDate'))}
                            onChange={e => updateField('credentialSubject.activityStartDate', fromDateInputValue(e.target.value))}
                            className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityEndDate'))}
                            onChange={e => updateField('credentialSubject.activityEndDate', fromDateInputValue(e.target.value))}
                            className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 focus:outline-none focus:border-grayscale-400"
                        />
                    </div>
                </div>

                {/* Skills / Tags */}
                <div>
                    <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                        Skills / Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map((tag: string, i: number) => (
                            <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-${primaryColor}/10 text-${primaryColor}`}
                            >
                                {tag}
                                <button
                                    onClick={() => removeTag(i)}
                                    className="ml-0.5 hover:opacity-70"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Type a skill and press Enter..."
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>
            </div>

            {/* Footer */}
            <button
                onClick={() => onSave(vc)}
                className={`w-full mt-4 py-3 rounded-[30px] font-semibold text-white bg-${primaryColor}`}
            >
                Save Changes
            </button>
        </div>
    );
};

export default CredentialEditView;
