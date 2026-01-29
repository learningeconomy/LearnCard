/**
 * AchievementSection - Achievement details including criteria
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Plus, X, ChevronDown, Folder } from 'lucide-react';
import { constructCustomBoostType, isCustomBoostType, getCategoryTypeFromCustomType, getAchievementTypeFromCustomType, replaceUnderscoresWithWhiteSpace } from 'learn-card-base/helpers/boostCustomTypeHelpers';

import { 
    OBv3CredentialTemplate, 
    AchievementTemplate, 
    TemplateFieldValue, 
    AlignmentTemplate,
    staticField,
    OBV3_ACHIEVEMENT_TYPES,
} from '../types';
import { FieldEditor, CollapsibleSection } from '../FieldEditor';

interface AchievementSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
}

export const AchievementSection: React.FC<AchievementSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
}) => {
    const achievement = template.credentialSubject.achievement;

    const updateAchievement = (key: keyof AchievementTemplate, value: TemplateFieldValue | AchievementTemplate['criteria'] | AlignmentTemplate[]) => {
        onChange({
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                achievement: { ...achievement, [key]: value },
            },
        });
    };

    const updateCriteria = (key: 'id' | 'narrative', value: TemplateFieldValue) => {
        onChange({
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                achievement: {
                    ...achievement,
                    criteria: { ...achievement.criteria, [key]: value },
                },
            },
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

    const updateAlignment = (index: number, field: keyof AlignmentTemplate, value: TemplateFieldValue) => {
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
        // Initialize from existing value if it's a custom type
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
    const walletCategories = useMemo(() => [
        { value: 'Achievement', label: 'Achievement', walletFolder: 'Achievements' },
        { value: 'Learning History', label: 'Learning History', walletFolder: 'Studies' },
        { value: 'Work History', label: 'Work History', walletFolder: 'Experiences' },
        { value: 'Social Badge', label: 'Social Badge', walletFolder: 'Boosts' },
        { value: 'ID', label: 'ID', walletFolder: 'IDs' },
        { value: 'Membership', label: 'Membership', walletFolder: 'Memberships' },
        { value: 'Accommodation', label: 'Accommodation', walletFolder: 'Assistance' },
    ], []);

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
            // Reset to default standard type
            updateAchievement('achievementType', staticField('Badge'));
        }
    };

    // Preview the generated custom type
    const customTypePreview = useMemo(() => {
        if (!customTypeName.trim()) return '';
        return constructCustomBoostType(customCategory, customTypeName.trim());
    }, [customCategory, customTypeName]);

    return (
        <CollapsibleSection
            title="Achievement"
            icon={<Trophy className="w-4 h-4 text-amber-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            badge={achievement.achievementType?.value}
        >
            <FieldEditor
                label="Achievement Name"
                field={achievement.name}
                onChange={(f) => updateAchievement('name', f)}
                placeholder="e.g., Web Development Fundamentals"
                helpText="The name of the achievement being recognized"
                required
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label="Achievement Description"
                field={achievement.description}
                onChange={(f) => updateAchievement('description', f)}
                placeholder="Describe the achievement..."
                helpText="What did the recipient achieve?"
                type="textarea"
                showDynamicToggle={!disableDynamicFields}
            />

            {/* Achievement Type Section */}
            <div className="space-y-3">
                {!useCustomType ? (
                    <FieldEditor
                        label="Achievement Type"
                        field={achievement.achievementType || staticField('')}
                        onChange={(f) => updateAchievement('achievementType', f)}
                        helpText="The category of achievement per OBv3 spec"
                        type="select"
                        options={achievementTypeOptions}
                        showDynamicToggle={!disableDynamicFields}
                    />
                ) : (
                    <div className="space-y-3">
                        <label className="block text-xs font-medium text-gray-600">Achievement Type</label>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Wallet Category</label>
                            <div className="relative">
                                <select
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none bg-white"
                                >
                                    {walletCategories.map(cat => (
                                        <option key={cat.value} value={cat.value}>
                                            {cat.label} → {cat.walletFolder} folder
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Where this credential will appear in the recipient's wallet</p>
                        </div>

                        {/* Custom Type Name */}
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Custom Type Name</label>
                            <input
                                type="text"
                                value={customTypeName}
                                onChange={(e) => setCustomTypeName(e.target.value)}
                                placeholder="e.g., Team Player, Course Completion, Work Experience"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-400 mt-1">A descriptive name for this type of credential</p>
                        </div>

                        {/* Preview */}
                        {customTypePreview && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 text-xs text-amber-700">
                                    <Folder className="w-3.5 h-3.5" />
                                    <span className="font-medium">Generated type:</span>
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
                        onChange={(e) => handleToggleCustomType(e.target.checked)}
                        className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-xs text-gray-600">
                        Use custom type to target a specific wallet folder
                    </span>
                </label>
            </div>

            <FieldEditor
                label="Achievement Image"
                field={achievement.image || staticField('')}
                onChange={(f) => updateAchievement('image', f)}
                placeholder="https://example.com/badge-image.png"
                helpText="Badge or achievement image URL"
                type="url"
                enableFileUpload
                showDynamicToggle={!disableDynamicFields}
            />

            <FieldEditor
                label="Achievement ID"
                field={achievement.id || staticField('')}
                onChange={(f) => updateAchievement('id', f)}
                placeholder="urn:uuid:..."
                helpText="Unique identifier for this achievement type"
                showDynamicToggle={!disableDynamicFields}
            />

            {/* Additional OBv3 Achievement Fields */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Details</h4>

                <div className="grid grid-cols-2 gap-3">
                    <FieldEditor
                        label="Human Code"
                        field={achievement.humanCode || staticField('')}
                        onChange={(f) => updateAchievement('humanCode', f)}
                        placeholder="e.g., CS101"
                        helpText="Human-readable code (course number)"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Credits Available"
                        field={achievement.creditsAvailable || staticField('')}
                        onChange={(f) => updateAchievement('creditsAvailable', f)}
                        placeholder="e.g., 3"
                        helpText="Number of credits"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Field of Study"
                        field={achievement.fieldOfStudy || staticField('')}
                        onChange={(f) => updateAchievement('fieldOfStudy', f)}
                        placeholder="e.g., Computer Science"
                        helpText="Academic discipline"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Specialization"
                        field={achievement.specialization || staticField('')}
                        onChange={(f) => updateAchievement('specialization', f)}
                        placeholder="e.g., Web Development"
                        helpText="Area of specialization"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Version"
                        field={achievement.version || staticField('')}
                        onChange={(f) => updateAchievement('version', f)}
                        placeholder="e.g., 1.0"
                        helpText="Version of this achievement"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Language"
                        field={achievement.inLanguage || staticField('')}
                        onChange={(f) => updateAchievement('inLanguage', f)}
                        placeholder="e.g., en"
                        helpText="Language code (ISO 639-1)"
                        showDynamicToggle={!disableDynamicFields}
                    />
                </div>

                {/* Tags */}
                <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tags</label>
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
                                        onChange({
                                            ...template,
                                            credentialSubject: {
                                                ...template.credentialSubject,
                                                achievement: { ...achievement, tag: newTags },
                                            },
                                        });
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
                        placeholder="Add tag and press Enter"
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const input = e.currentTarget;
                                const value = input.value.trim();
                                if (value) {
                                    onChange({
                                        ...template,
                                        credentialSubject: {
                                            ...template.credentialSubject,
                                            achievement: {
                                                ...achievement,
                                                tag: [...(achievement.tag || []), value],
                                            },
                                        },
                                    });
                                    input.value = '';
                                }
                            }
                        }}
                    />
                    <p className="text-xs text-gray-400 mt-1">Keywords for categorization</p>
                </div>
            </div>

            {/* Criteria Sub-section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Criteria</h4>

                <div className="space-y-3 pl-3 border-l-2 border-amber-200">
                    <FieldEditor
                        label="Criteria Narrative"
                        field={achievement.criteria?.narrative || staticField('')}
                        onChange={(f) => updateCriteria('narrative', f)}
                        placeholder="Describe what was required to earn this achievement..."
                        helpText="Human-readable description of the criteria"
                        type="textarea"
                        showDynamicToggle={!disableDynamicFields}
                    />

                    <FieldEditor
                        label="Criteria ID"
                        field={achievement.criteria?.id || staticField('')}
                        onChange={(f) => updateCriteria('id', f)}
                        placeholder="https://example.com/criteria/..."
                        helpText="URL to detailed criteria documentation"
                        type="url"
                        showDynamicToggle={!disableDynamicFields}
                    />
                </div>
            </div>

            {/* Alignment Sub-section */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Alignment</h4>

                    <button
                        type="button"
                        onClick={addAlignment}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                    >
                        <Plus className="w-3 h-3" />
                        Add Alignment
                    </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                    Link this achievement to standards, frameworks, or competencies
                </p>

                {(achievement.alignment || []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic pl-3">No alignments added</p>
                ) : (
                    <div className="space-y-4">
                        {(achievement.alignment || []).map((alignment, index) => (
                            <div key={alignment.id} className="pl-3 border-l-2 border-amber-200 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-amber-700">
                                        Alignment {index + 1}
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
                                    label="Target Name"
                                    field={alignment.targetName}
                                    onChange={(f) => updateAlignment(index, 'targetName', f)}
                                    placeholder="e.g., ISTE Standards for Students"
                                    helpText="Name of the framework or standard"
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label="Target URL"
                                    field={alignment.targetUrl}
                                    onChange={(f) => updateAlignment(index, 'targetUrl', f)}
                                    placeholder="https://..."
                                    helpText="URL to the standard or framework"
                                    type="url"
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label="Target Framework"
                                    field={alignment.targetFramework || staticField('')}
                                    onChange={(f) => updateAlignment(index, 'targetFramework', f)}
                                    placeholder="e.g., ISTE"
                                    helpText="Name of the framework"
                                    showDynamicToggle={!disableDynamicFields}
                                />

                                <FieldEditor
                                    label="Target Code"
                                    field={alignment.targetCode || staticField('')}
                                    onChange={(f) => updateAlignment(index, 'targetCode', f)}
                                    placeholder="e.g., 1.a"
                                    helpText="Code within the framework"
                                    showDynamicToggle={!disableDynamicFields}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CollapsibleSection>
    );
};

export default AchievementSection;
