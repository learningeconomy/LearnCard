/**
 * AchievementsListSection - CLR 2.0 multi-achievement list section
 *
 * Manages an array of AchievementEntryTemplate objects, rendering each
 * via the AchievementEditor component with per-entry fields for credits,
 * activity dates, and results.
 */

import React, { useState } from 'react';
import { List, Plus, X, ChevronDown, ChevronRight, Trophy, Save } from 'lucide-react';

import {
    OBv3CredentialTemplate,
    AchievementEntryTemplate,
    AchievementTemplate,
    ResultTemplate,
    TemplateFieldValue,
    staticField,
} from '../types';
import { CollapsibleSection, FieldEditor } from '../FieldEditor';
import { FieldValidationError, getFieldError } from '../utils';
import { AchievementEditor } from './AchievementEditor';

interface AchievementsListSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
    validationErrors?: FieldValidationError[];
}

const createBlankAchievement = (): AchievementTemplate => ({
    name: staticField(''),
    description: staticField(''),
});

const createNewEntry = (): AchievementEntryTemplate => ({
    id: crypto.randomUUID(),
    achievement: createBlankAchievement(),
    result: [],
});

export const AchievementsListSection: React.FC<AchievementsListSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
    validationErrors = [],
}) => {
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
    const [saveAttempted, setSaveAttempted] = useState<Set<string>>(new Set());

    const achievements = template.clrSubject?.achievements || [];

    // Only show the top-level error banner for entries that have been save-attempted
    const hasErrors = achievements.some((entry, index) => {
        if (!saveAttempted.has(entry.id)) return false;
        return validationErrors.some(
            e => e.field.startsWith(`achievements.${index}.`) || e.field === 'achievements-list'
        );
    });

    const updateAchievements = (newAchievements: AchievementEntryTemplate[]) => {
        onChange({
            ...template,
            clrSubject: {
                ...template.clrSubject!,
                achievements: newAchievements,
            },
        });
    };

    const toggleEntry = (id: string) => {
        setExpandedEntries(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const addAchievement = () => {
        const newEntry = createNewEntry();
        updateAchievements([...achievements, newEntry]);
        // Auto-expand the new entry
        setExpandedEntries(prev => new Set(prev).add(newEntry.id));
    };

    const removeAchievement = (id: string) => {
        updateAchievements(achievements.filter(entry => entry.id !== id));
        setExpandedEntries(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
        setSaveAttempted(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const handleSaveEntry = (id: string, index: number) => {
        setSaveAttempted(prev => new Set(prev).add(id));
        const entryHasErrors = validationErrors.some(e =>
            e.field.startsWith(`achievements.${index}.`)
        );
        if (!entryHasErrors) {
            setExpandedEntries(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const updateEntry = (index: number, updatedEntry: AchievementEntryTemplate) => {
        const newAchievements = [...achievements];
        newAchievements[index] = updatedEntry;
        updateAchievements(newAchievements);
        // Mark as save-attempted on any edit so validation shows for existing/preset entries
        setSaveAttempted(prev => new Set(prev).add(updatedEntry.id));
    };

    const updateEntryAchievement = (index: number, achievement: AchievementTemplate) => {
        const entry = achievements[index];
        updateEntry(index, { ...entry, achievement });
    };

    const updateEntryField = (
        index: number,
        field: keyof Pick<AchievementEntryTemplate, 'creditsEarned' | 'activityStartDate' | 'activityEndDate'>,
        value: TemplateFieldValue
    ) => {
        const entry = achievements[index];
        updateEntry(index, { ...entry, [field]: value });
    };

    const getEntrySummary = (entry: AchievementEntryTemplate): string => {
        const name = entry.achievement.name;
        if (name.value) return name.value;
        if (name.isDynamic && name.variableName) {
            return `[${name.variableName.replace(/_/g, ' ')}]`;
        }
        return 'Untitled Achievement';
    };

    const getEntryTypeBadge = (entry: AchievementEntryTemplate): string | undefined => {
        return entry.achievement.achievementType?.value || undefined;
    };

    return (
        <CollapsibleSection
            title="Achievements"
            icon={<List className="w-4 h-4 text-indigo-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            badge={
                achievements.length > 0
                    ? `${achievements.length} achievement${achievements.length > 1 ? 's' : ''}`
                    : undefined
            }
        >
            {hasErrors && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-3">
                    <span className="text-xs text-red-600">
                        Some achievements have validation errors
                    </span>
                </div>
            )}

            <p className="text-xs text-gray-500 mb-3">
                Add multiple achievements to this CLR credential. Each achievement represents a
                distinct learning outcome or competency.
            </p>

            {achievements.length === 0 ? (
                <p className="text-xs text-gray-400 italic mb-3">No achievements added</p>
            ) : (
                <div className="space-y-3">
                    {achievements.map((entry, index) => {
                        const entryExpanded = expandedEntries.has(entry.id);
                        const summary = getEntrySummary(entry);
                        const typeBadge = getEntryTypeBadge(entry);

                        return (
                            <div
                                key={entry.id}
                                className={`border rounded-lg overflow-hidden ${
                                    saveAttempted.has(entry.id) &&
                                    validationErrors.some(e =>
                                        e.field.startsWith(`achievements.${index}.`)
                                    )
                                        ? 'border-red-400'
                                        : 'border-gray-200'
                                }`}
                            >
                                {/* Entry Header */}
                                <div className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => toggleEntry(entry.id)}
                                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                                    >
                                        <Trophy className="w-4 h-4 text-indigo-500 flex-shrink-0" />

                                        <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                                            {summary}
                                        </span>

                                        {typeBadge && (
                                            <span className="text-xs text-indigo-600 px-2 py-0.5 bg-indigo-100 rounded flex-shrink-0">
                                                {typeBadge}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => removeAchievement(entry.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded flex-shrink-0"
                                        title="Remove achievement"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => toggleEntry(entry.id)}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded flex-shrink-0"
                                        title={entryExpanded ? 'Collapse' : 'Edit'}
                                    >
                                        {entryExpanded ? (
                                            <ChevronDown className="w-4 h-4" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Entry Body (expanded) */}
                                {entryExpanded && (
                                    <div className="p-4 space-y-4 border-t border-gray-100">
                                        {/* Achievement Editor */}
                                        <div className="pl-3 border-l-2 border-indigo-200">
                                            <AchievementEditor
                                                achievement={entry.achievement}
                                                onChange={ach =>
                                                    updateEntryAchievement(index, ach)
                                                }
                                                disableDynamicFields={disableDynamicFields}
                                                validationErrors={saveAttempted.has(entry.id) ? validationErrors : []}
                                                validationPrefix={`achievements.${index}`}
                                            />
                                        </div>

                                        {/* Per-entry fields */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                                Entry Details
                                            </h4>

                                            <div className="space-y-3 pl-3 border-l-2 border-indigo-200">
                                                <FieldEditor
                                                    label="Credits Earned"
                                                    field={
                                                        entry.creditsEarned || staticField('')
                                                    }
                                                    onChange={f =>
                                                        updateEntryField(
                                                            index,
                                                            'creditsEarned',
                                                            f
                                                        )
                                                    }
                                                    placeholder="e.g., 3"
                                                    helpText="Number of credits earned for this achievement"
                                                    showDynamicToggle={!disableDynamicFields}
                                                    error={saveAttempted.has(entry.id) ? getFieldError(
                                                        validationErrors,
                                                        `achievements.${index}.creditsEarned`
                                                    ) : undefined}
                                                />

                                                <div className="grid grid-cols-2 gap-3 xs:flex xs:flex-col">
                                                    <FieldEditor
                                                        label="Activity Start Date"
                                                        field={
                                                            entry.activityStartDate ||
                                                            staticField('')
                                                        }
                                                        onChange={f =>
                                                            updateEntryField(
                                                                index,
                                                                'activityStartDate',
                                                                f
                                                            )
                                                        }
                                                        placeholder="e.g., 2024-01-15"
                                                        helpText="When the activity began"
                                                        showDynamicToggle={!disableDynamicFields}
                                                        error={saveAttempted.has(entry.id) ? getFieldError(
                                                            validationErrors,
                                                            `achievements.${index}.activityStartDate`
                                                        ) : undefined}
                                                    />

                                                    <FieldEditor
                                                        label="Activity End Date"
                                                        field={
                                                            entry.activityEndDate ||
                                                            staticField('')
                                                        }
                                                        onChange={f =>
                                                            updateEntryField(
                                                                index,
                                                                'activityEndDate',
                                                                f
                                                            )
                                                        }
                                                        placeholder="e.g., 2024-05-30"
                                                        helpText="When the activity ended"
                                                        showDynamicToggle={!disableDynamicFields}
                                                        error={saveAttempted.has(entry.id) ? getFieldError(
                                                            validationErrors,
                                                            `achievements.${index}.activityEndDate`
                                                        ) : undefined}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Results subsection (placeholder) */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium text-gray-700">
                                                    Results
                                                </h4>
                                            </div>

                                            <p className="text-xs text-gray-400 italic pl-3">
                                                {(entry.result || []).length === 0
                                                    ? 'No results added'
                                                    : `${entry.result!.length} result${entry.result!.length > 1 ? 's' : ''}`}
                                            </p>
                                        </div>

                                        {/* Save button */}
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEntry(entry.id, index)}
                                                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                Save Achievement
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Achievement button */}
            <button
                type="button"
                onClick={addAchievement}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors mt-3"
            >
                <Plus className="w-4 h-4" />
                Add Achievement
            </button>
        </CollapsibleSection>
    );
};

export default AchievementsListSection;
