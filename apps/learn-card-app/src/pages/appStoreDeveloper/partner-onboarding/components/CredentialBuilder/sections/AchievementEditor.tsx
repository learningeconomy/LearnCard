/**
 * AchievementEditor - Extracted inner editing UI for a single AchievementTemplate.
 *
 * This component contains all the field editing UI (name, description, type,
 * image, criteria, alignment, tags, etc.) but NOT the CollapsibleSection wrapper.
 * It operates directly on an AchievementTemplate rather than the full credential template.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, ChevronDown, Folder } from 'lucide-react';
import {
    constructCustomBoostType,
    isCustomBoostType,
    getCategoryTypeFromCustomType,
    getAchievementTypeFromCustomType,
    replaceUnderscoresWithWhiteSpace,
} from 'learn-card-base/helpers/boostCustomTypeHelpers';

import * as m from '../../../../../../paraglide/messages.js';

import {
    AchievementTemplate,
    TemplateFieldValue,
    AlignmentTemplate,
    staticField,
    OBV3_ACHIEVEMENT_TYPES,
} from '../types';
import { FieldEditor } from '../FieldEditor';
import { FieldValidationError, getFieldError } from '../utils';

interface AchievementEditorProps {
    achievement: AchievementTemplate;
    onChange: (achievement: AchievementTemplate) => void;
    disableDynamicFields?: boolean;
    validationErrors?: FieldValidationError[];
    validationPrefix?: string; // e.g., 'achievement' or 'achievements.0' for error path matching
}

export const AchievementEditor: React.FC<AchievementEditorProps> = ({
    achievement,
    onChange,
    disableDynamicFields = false,
    validationErrors = [],
    validationPrefix = 'achievement',
}) => {
    const updateAchievement = (
        key: keyof AchievementTemplate,
        value: TemplateFieldValue | AchievementTemplate['criteria'] | AlignmentTemplate[]
    ) => {
        onChange({ ...achievement, [key]: value });
    };

    const updateCriteria = (key: 'id' | 'narrative', value: TemplateFieldValue) => {
        onChange({
            ...achievement,
            criteria: { ...achievement.criteria, [key]: value },
        });
    };

    const addAlignment = () => {
        const newAlignment: AlignmentTemplate = {
            id: `alignment_${Date.now()}`,
            targetName: staticField(''),
            targetUrl: staticField(''),
        };

        updateAchievement('alignment', [...(achievement.alignment || []), newAlignment]);
    };

    const updateAlignment = (
        index: number,
        field: keyof AlignmentTemplate,
        value: TemplateFieldValue
    ) => {
        const alignments = [...(achievement.alignment || [])];
        alignments[index] = { ...alignments[index], [field]: value };
        updateAchievement('alignment', alignments);
    };

    const removeAlignment = (index: number) => {
        const alignments = [...(achievement.alignment || [])];
        alignments.splice(index, 1);
        updateAchievement('alignment', alignments);
    };

    const achievementTypeOptions = OBV3_ACHIEVEMENT_TYPES.map(type => ({
        value: type,
        label: type.replace(/([A-Z])/g, ' $1').trim(),
    }));

    // Custom type state
    const [useCustomType, setUseCustomType] = useState(() => {
        const currentType = achievement.achievementType?.value || '';
        return isCustomBoostType(currentType);
    });

    const [customCategory, setCustomCategory] = useState(() => {
        const currentType = achievement.achievementType?.value || '';
        if (isCustomBoostType(currentType)) {
            return getCategoryTypeFromCustomType(currentType) || 'Achievement';
        }
        return 'Achievement';
    });

    const [customTypeName, setCustomTypeName] = useState(() => {
        const currentType = achievement.achievementType?.value || '';
        if (isCustomBoostType(currentType)) {
            const rawName = getAchievementTypeFromCustomType(currentType) || '';
            return replaceUnderscoresWithWhiteSpace(rawName);
        }
        return '';
    });

    // Categories available for custom types (user-friendly subset)
    const walletCategories = useMemo(
        () => [
            {
                value: 'Achievement',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.achievement'
                ](),
                walletFolder: 'Achievements',
            },
            {
                value: 'Learning History',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.learningHistory'
                ](),
                walletFolder: 'Studies',
            },
            {
                value: 'Work History',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.workHistory'
                ](),
                walletFolder: 'Experiences',
            },
            {
                value: 'Social Badge',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.socialBadge'
                ](),
                walletFolder: 'Boosts',
            },
            {
                value: 'ID',
                label: m['developerPortal.credentialBuilder.achievement.walletCategories.id'](),
                walletFolder: 'IDs',
            },
            {
                value: 'Membership',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.membership'
                ](),
                walletFolder: 'Memberships',
            },
            {
                value: 'Accommodation',
                label: m[
                    'developerPortal.credentialBuilder.achievement.walletCategories.accommodation'
                ](),
                walletFolder: 'Assistance',
            },
        ],
        []
    );

    // Update achievementType when custom type settings change
    useEffect(() => {
        if (useCustomType && customTypeName.trim()) {
            const customType = constructCustomBoostType(customCategory, customTypeName.trim());
            if (achievement.achievementType?.value !== customType) {
                updateAchievement('achievementType', staticField(customType));
            }
        }
    }, [useCustomType, customCategory, customTypeName]);

    // Handle toggling custom type off - reset to standard type
    const handleToggleCustomType = (enabled: boolean) => {
        setUseCustomType(enabled);
        if (!enabled) {
            updateAchievement('achievementType', staticField('Badge'));
        }
    };

    // Preview the generated custom type
    const customTypePreview = useMemo(() => {
        if (!customTypeName.trim()) return '';
        return constructCustomBoostType(customCategory, customTypeName.trim());
    }, [customCategory, customTypeName]);

    return (
        <>
            <FieldEditor
                label={m['developerPortal.credentialBuilder.achievement.name']()}
                field={achievement.name}
                onChange={f => updateAchievement('name', f)}
                placeholder={m['developerPortal.credentialBuilder.achievement.namePlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.achievement.nameHelp']()}
                required
                showDynamicToggle={!disableDynamicFields}
                error={getFieldError(validationErrors, `${validationPrefix}.name`)}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.achievement.description']()}
                field={achievement.description}
                onChange={f => updateAchievement('description', f)}
                placeholder={m[
                    'developerPortal.credentialBuilder.achievement.descriptionPlaceholder'
                ]()}
                helpText={m['developerPortal.credentialBuilder.achievement.descriptionHelp']()}
                type="textarea"
                showDynamicToggle={!disableDynamicFields}
            />

            {/* Achievement Type Section */}
            <div className="space-y-3">
                {!useCustomType ? (
                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.type']()}
                        field={achievement.achievementType || staticField('')}
                        onChange={f => updateAchievement('achievementType', f)}
                        helpText={m['developerPortal.credentialBuilder.achievement.typeHelp']()}
                        type="select"
                        options={achievementTypeOptions}
                        showDynamicToggle={!disableDynamicFields}
                    />
                ) : (
                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-600">
                            {m['developerPortal.credentialBuilder.achievement.type']()}
                        </label>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {m[
                                    'developerPortal.credentialBuilder.achievement.walletCategory'
                                ]()}
                            </label>
                            <div className="relative">
                                <select
                                    value={customCategory}
                                    onChange={e => setCustomCategory(e.target.value)}
                                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    {walletCategories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {m[
                                                'developerPortal.credentialBuilder.achievement.walletFolderLabel'
                                            ]({ label: cat.label, folder: cat.walletFolder })}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {m[
                                    'developerPortal.credentialBuilder.achievement.walletCategoryHelp'
                                ]()}
                            </p>
                        </div>

                        {/* Custom Type Name */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">
                                {m[
                                    'developerPortal.credentialBuilder.achievement.customTypeName'
                                ]()}
                            </label>
                            <input
                                type="text"
                                value={customTypeName}
                                onChange={e => setCustomTypeName(e.target.value)}
                                placeholder={m[
                                    'developerPortal.credentialBuilder.achievement.customTypeNamePlaceholder'
                                ]()}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {m[
                                    'developerPortal.credentialBuilder.achievement.customTypeHelp'
                                ]()}
                            </p>
                        </div>

                        {/* Preview */}
                        {customTypePreview && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-amber-700">
                                    <Folder className="w-3.5 h-3.5" />
                                    <span className="font-medium">
                                        {m[
                                            'developerPortal.credentialBuilder.achievement.generatedType'
                                        ]()}
                                    </span>
                                </div>
                                <code className="block mt-1 text-xs text-amber-800 font-mono break-all">
                                    {customTypePreview}
                                </code>
                            </div>
                        )}
                    </div>
                )}

                {/* Toggle for custom type */}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={useCustomType}
                        onChange={e => handleToggleCustomType(e.target.checked)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-xs text-gray-600">
                        {m['developerPortal.credentialBuilder.achievement.useCustomType']()}
                    </span>
                </label>
            </div>

            <FieldEditor
                label={m['developerPortal.credentialBuilder.achievement.image']()}
                field={achievement.image || staticField('')}
                onChange={f => updateAchievement('image', f)}
                placeholder={m['developerPortal.credentialBuilder.achievement.imagePlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.achievement.imageHelp']()}
                type="url"
                enableFileUpload
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label={m['developerPortal.credentialBuilder.achievement.id']()}
                field={achievement.id || staticField('')}
                onChange={f => updateAchievement('id', f)}
                placeholder={m['developerPortal.credentialBuilder.achievement.idPlaceholder']()}
                helpText={m['developerPortal.credentialBuilder.achievement.idHelp']()}
                showDynamicToggle={!disableDynamicFields}
            />

            {/* Additional OBv3 Achievement Fields */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {m['developerPortal.credentialBuilder.achievement.additionalDetails']()}
                </h4>

                <div className="grid grid-cols-2 gap-3 xs:flex xs:flex-col">
                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.humanCode']()}
                        field={achievement.humanCode || staticField('')}
                        onChange={f => updateAchievement('humanCode', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.humanCodePlaceholder'
                        ]()}
                        helpText={m[
                            'developerPortal.credentialBuilder.achievement.humanCodeHelp'
                        ]()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m[
                            'developerPortal.credentialBuilder.achievement.creditsAvailable'
                        ]()}
                        field={achievement.creditsAvailable || staticField('')}
                        onChange={f => updateAchievement('creditsAvailable', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.creditsAvailablePlaceholder'
                        ]()}
                        helpText={m[
                            'developerPortal.credentialBuilder.achievement.creditsAvailableHelp'
                        ]()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.fieldOfStudy']()}
                        field={achievement.fieldOfStudy || staticField('')}
                        onChange={f => updateAchievement('fieldOfStudy', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.fieldOfStudyPlaceholder'
                        ]()}
                        helpText={m[
                            'developerPortal.credentialBuilder.achievement.fieldOfStudyHelp'
                        ]()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.specialization']()}
                        field={achievement.specialization || staticField('')}
                        onChange={f => updateAchievement('specialization', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.specializationPlaceholder'
                        ]()}
                        helpText={m[
                            'developerPortal.credentialBuilder.achievement.specializationHelp'
                        ]()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.version']()}
                        field={achievement.version || staticField('')}
                        onChange={f => updateAchievement('version', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.versionPlaceholder'
                        ]()}
                        helpText={m['developerPortal.credentialBuilder.achievement.versionHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.ctid']()}
                        field={achievement.ctid || staticField('')}
                        onChange={f => {
                            // Extract CTID from full Credential Finder URL if provided
                            let ctidValue = f.value;
                            if (ctidValue && !f.isDynamic) {
                                const urlMatch = ctidValue.match(
                                    /credentialfinder\.org\/credential\/(ce-[0-9a-f-]+)/i
                                );
                                if (urlMatch) {
                                    ctidValue = urlMatch[1];
                                }
                            }
                            updateAchievement('ctid', { ...f, value: ctidValue });
                        }}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.ctidPlaceholder'
                        ]()}
                        helpText={m['developerPortal.credentialBuilder.achievement.ctidHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                        error={getFieldError(validationErrors, 'achievement.ctid')}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.language']()}
                        field={achievement.inLanguage || staticField('')}
                        onChange={f => updateAchievement('inLanguage', f)}
                        type="select"
                        options={[
                            { value: 'en-US', label: 'English (US)' },
                            { value: 'en-GB', label: 'English (UK)' },
                            { value: 'es-ES', label: 'Spanish (Spain)' },
                            { value: 'es-MX', label: 'Spanish (Mexico)' },
                            { value: 'fr-FR', label: 'French (France)' },
                            { value: 'fr-CA', label: 'French (Canada)' },
                            { value: 'de-DE', label: 'German' },
                            { value: 'pt-BR', label: 'Portuguese (Brazil)' },
                            { value: 'pt-PT', label: 'Portuguese (Portugal)' },
                            { value: 'zh-CN', label: 'Chinese (Simplified)' },
                            { value: 'zh-TW', label: 'Chinese (Traditional)' },
                            { value: 'ja-JP', label: 'Japanese' },
                            { value: 'ko-KR', label: 'Korean' },
                            { value: 'ar-SA', label: 'Arabic' },
                            { value: 'hi-IN', label: 'Hindi' },
                            { value: 'it-IT', label: 'Italian' },
                            { value: 'nl-NL', label: 'Dutch' },
                            { value: 'ru-RU', label: 'Russian' },
                            { value: 'sv-SE', label: 'Swedish' },
                            { value: 'pl-PL', label: 'Polish' },
                            { value: 'tr-TR', label: 'Turkish' },
                            { value: 'vi-VN', label: 'Vietnamese' },
                            { value: 'th-TH', label: 'Thai' },
                            { value: 'id-ID', label: 'Indonesian' },
                            { value: 'he-IL', label: 'Hebrew' },
                        ]}
                        helpText={m['developerPortal.credentialBuilder.achievement.languageHelp']()}
                        showDynamicToggle={!disableDynamicFields}
                    />
                </div>

                {/* Tags */}
                <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        {m['developerPortal.credentialBuilder.achievement.tags']()}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {(achievement.tag || []).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newTags = [...(achievement.tag || [])];
                                        newTags.splice(index, 1);
                                        onChange({ ...achievement, tag: newTags });
                                    }}
                                    className="text-amber-500 hover:text-amber-700"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.tagsPlaceholder'
                        ]()}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const value = input.value.trim();
                                if (value) {
                                    onChange({
                                        ...achievement,
                                        tag: [...(achievement.tag || []), value],
                                    });
                                    input.value = '';
                                }
                            }
                        }}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                        {m['developerPortal.credentialBuilder.achievement.tagsHelp']()}
                    </p>
                </div>
            </div>

            {/* Criteria Sub-section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    {m['developerPortal.credentialBuilder.achievement.criteria']()}
                </h4>

                <div className="space-y-3 pl-3 border-l-2 border-amber-200">
                    <FieldEditor
                        label={m[
                            'developerPortal.credentialBuilder.achievement.criteriaNarrative'
                        ]()}
                        field={achievement.criteria?.narrative || staticField('')}
                        onChange={f => updateCriteria('narrative', f)}
                        placeholder={m[
                            'developerPortal.credentialBuilder.achievement.criteriaNarrativePlaceholder'
                        ]()}
                        helpText="Human-readable description of the criteria"
                        type="textarea"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label={m['developerPortal.credentialBuilder.achievement.criteriaId']()}
                        field={achievement.criteria?.id || staticField('')}
                        onChange={f => updateCriteria('id', f)}
                        placeholder="https://example.com/criteria/..."
                        helpText="URL to detailed criteria documentation"
                        type="url"
                        showDynamicToggle={!disableDynamicFields}
                        error={getFieldError(validationErrors, `${validationPrefix}.criteria.id`)}
                    />
                </div>
            </div>

            {/* Alignment Sub-section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">
                        {m['developerPortal.credentialBuilder.achievement.alignment']()}
                    </h4>

                    <button
                        type="button"
                        onClick={addAlignment}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        {m['developerPortal.credentialBuilder.achievement.addAlignment']()}
                    </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                    {m['developerPortal.credentialBuilder.achievement.alignmentDescription']()}
                </p>

                {(achievement.alignment || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-3">
                        {m['developerPortal.credentialBuilder.achievement.noAlignments']()}
                    </p>
                ) : (
                    <div className="space-y-4">
                        {(achievement.alignment || []).map((alignment, index) => (
                            <div
                                key={alignment.id}
                                className="pl-3 border-l-2 border-amber-200 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-amber-700">
                                        {m[
                                            'developerPortal.credentialBuilder.achievement.alignmentNumber'
                                        ]({ n: index + 1 })}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => removeAlignment(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                <FieldEditor
                                    label={m[
                                        'developerPortal.credentialBuilder.achievement.targetName'
                                    ]()}
                                    field={alignment.targetName}
                                    onChange={f => updateAlignment(index, 'targetName', f)}
                                    placeholder={m[
                                        'developerPortal.credentialBuilder.achievement.targetNamePlaceholder'
                                    ]()}
                                    helpText={m[
                                        'developerPortal.credentialBuilder.achievement.targetNameHelp'
                                    ]()}
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label={m[
                                        'developerPortal.credentialBuilder.achievement.targetUrl'
                                    ]()}
                                    field={alignment.targetUrl}
                                    onChange={f => updateAlignment(index, 'targetUrl', f)}
                                    placeholder={m[
                                        'developerPortal.credentialBuilder.achievement.targetUrlPlaceholder'
                                    ]()}
                                    helpText={m[
                                        'developerPortal.credentialBuilder.achievement.targetUrlHelp'
                                    ]()}
                                    type="url"
                                    showDynamicToggle={!disableDynamicFields}
                                    error={getFieldError(
                                        validationErrors,
                                        `${validationPrefix}.alignment.${index}.targetUrl`
                                    )}
                                />

                                <FieldEditor
                                    label={m[
                                        'developerPortal.credentialBuilder.achievement.targetFramework'
                                    ]()}
                                    field={alignment.targetFramework || staticField('')}
                                    onChange={f => updateAlignment(index, 'targetFramework', f)}
                                    placeholder={m[
                                        'developerPortal.credentialBuilder.achievement.targetFrameworkPlaceholder'
                                    ]()}
                                    helpText={m[
                                        'developerPortal.credentialBuilder.achievement.targetFrameworkHelp'
                                    ]()}
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label={m[
                                        'developerPortal.credentialBuilder.achievement.targetCode'
                                    ]()}
                                    field={alignment.targetCode || staticField('')}
                                    onChange={f => updateAlignment(index, 'targetCode', f)}
                                    placeholder={m[
                                        'developerPortal.credentialBuilder.achievement.targetCodePlaceholder'
                                    ]()}
                                    helpText={m[
                                        'developerPortal.credentialBuilder.achievement.targetCodeHelp'
                                    ]()}
                                    showDynamicToggle={!disableDynamicFields}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default AchievementEditor;
