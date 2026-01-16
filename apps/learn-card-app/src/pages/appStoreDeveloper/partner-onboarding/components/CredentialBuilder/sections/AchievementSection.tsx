/**
 * AchievementSection - Achievement details including criteria
 */

import React from 'react';
import { Trophy, Plus, X } from 'lucide-react';

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

            <FieldEditor
                label="Achievement Type"
                field={achievement.achievementType || staticField('')}
                onChange={(f) => updateAchievement('achievementType', f)}
                helpText="The category of achievement per OBv3 spec"
                type="select"
                options={achievementTypeOptions}
                showDynamicToggle={!disableDynamicFields}
            />

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
