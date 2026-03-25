import React, { useState } from 'react';
import { ModalTypes, useModal, useDeviceTypeByWidth } from 'learn-card-base';
import { useTheme } from '../../../../theme/hooks/useTheme';
import DatePickerInput from '../../../date-picker/DatePickerInput';
import { ParsedCredential } from './CheckListCredentialReviewStep';
import AchievementTypeSelectorModal, {
    formatAchievementType,
    getWalletCategory,
} from './AchievementTypeSelectorModal';

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

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Set a nested path on a deep-cloned VC. Empty string removes the key. */
const setField = (vc: any, path: string, value: string): any => {
    const clone = JSON.parse(JSON.stringify(vc));
    const keys = path.split('.');
    if (keys.some(k => UNSAFE_KEYS.has(k))) return clone;
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
    const { colors } = useTheme();
    const { newModal, closeModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();
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
                        maxLength={100}
                        value={getField(vc, 'credentialSubject.achievement.name')}
                        onChange={e => updateField('credentialSubject.achievement.name', e.target.value)}
                        placeholder="e.g. Software Engineer at Acme Corp"
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400"
                    />
                </div>

                {/* Description */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-grayscale-700">
                            Description
                        </label>
                        <span className="text-xs text-grayscale-400">
                            {getField(vc, 'credentialSubject.achievement.description').length}/500
                        </span>
                    </div>
                    <textarea
                        rows={3}
                        maxLength={500}
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
                    {(() => {
                        const currentType = getField(vc, 'credentialSubject.achievement.achievementType');
                        const category = currentType ? getWalletCategory(currentType) : '';
                        return (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        newModal(
                                            <AchievementTypeSelectorModal
                                                selected={currentType}
                                                onSelect={type => {
                                                    updateField('credentialSubject.achievement.achievementType', type);
                                                    closeModal();
                                                }}
                                            />,
                                            {
                                                sectionClassName:
                                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                                            },
                                            {
                                                desktop: ModalTypes.Center,
                                                mobile: ModalTypes.Center,
                                            }
                                        );
                                    }}
                                    className="w-full flex items-center justify-between px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm bg-white"
                                >
                                    <span className={currentType ? 'text-grayscale-900' : 'text-grayscale-400'}>
                                        {currentType ? formatAchievementType(currentType) : 'Select type...'}
                                    </span>
                                    <svg className="w-4 h-4 text-grayscale-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {category && (
                                    <p className="text-xs text-grayscale-500 mt-1">
                                        Wallet category: <span className="font-medium">{category}</span>
                                    </p>
                                )}
                            </>
                        );
                    })()}
                </div>

                {/* Criteria */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-semibold text-grayscale-700">
                            Criteria
                        </label>
                        <span className="text-xs text-grayscale-400">
                            {getField(vc, 'credentialSubject.achievement.criteria.narrative').length}/500
                        </span>
                    </div>
                    <textarea
                        rows={5}
                        maxLength={500}
                        value={getField(vc, 'credentialSubject.achievement.criteria.narrative')}
                        onChange={e => updateField('credentialSubject.achievement.criteria.narrative', e.target.value)}
                        placeholder="Criteria for earning this credential..."
                        className="w-full px-3 py-2 border border-grayscale-200 rounded-[10px] text-sm text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:border-grayscale-400 resize-y"
                    />
                </div>

                {/* Dates */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            Start Date
                        </label>
                        <DatePickerInput
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityStartDate'))}
                            onChange={date => updateField('credentialSubject.activityStartDate', fromDateInputValue(date))}
                            isMobile={isMobile}
                            label="Start Date"
                            maxDate={toDateInputValue(getField(vc, 'credentialSubject.activityEndDate')) || undefined}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold text-grayscale-700 mb-1">
                            End Date
                        </label>
                        <DatePickerInput
                            value={toDateInputValue(getField(vc, 'credentialSubject.activityEndDate'))}
                            onChange={date => updateField('credentialSubject.activityEndDate', fromDateInputValue(date))}
                            isMobile={isMobile}
                            label="End Date"
                            minDate={toDateInputValue(getField(vc, 'credentialSubject.activityStartDate')) || undefined}
                        />
                    </div>
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
