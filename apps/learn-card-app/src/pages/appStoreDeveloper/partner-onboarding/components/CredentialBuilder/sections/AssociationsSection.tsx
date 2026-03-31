/**
 * AssociationsSection - CLR 2.0 inter-achievement relationships
 *
 * Allows creating associations between achievements with a type dropdown.
 * Only rendered for CLR 2.0 credentials.
 */

import React from 'react';
import { Link2, Plus, X, ChevronDown } from 'lucide-react';

import {
    OBv3CredentialTemplate,
    AssociationTemplate,
    staticField,
    CLR2_ASSOCIATION_TYPES,
} from '../types';
import { CollapsibleSection } from '../FieldEditor';
import { FieldValidationError, getFieldError } from '../utils';

interface AssociationsSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    validationErrors?: FieldValidationError[];
}

export const AssociationsSection: React.FC<AssociationsSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    validationErrors = [],
}) => {
    const associations = template.clrSubject?.associations || [];
    const achievements = template.clrSubject?.achievements || [];

    const updateAssociations = (newAssociations: AssociationTemplate[]) => {
        onChange({
            ...template,
            clrSubject: {
                ...template.clrSubject!,
                associations: newAssociations,
            },
        });
    };

    const addAssociation = () => {
        const newAssoc: AssociationTemplate = {
            id: crypto.randomUUID(),
            associationType: staticField('isChildOf'),
            sourceAchievementId: achievements[0]?.id || '',
            targetAchievementId: achievements[1]?.id || achievements[0]?.id || '',
        };
        updateAssociations([...associations, newAssoc]);
    };

    const updateAssociation = (index: number, updates: Partial<AssociationTemplate>) => {
        const updated = [...associations];
        updated[index] = { ...updated[index], ...updates };
        updateAssociations(updated);
    };

    const removeAssociation = (index: number) => {
        const updated = [...associations];
        updated.splice(index, 1);
        updateAssociations(updated);
    };

    const hasErrors = validationErrors.some(e => e.field.startsWith('associations.'));

    return (
        <CollapsibleSection
            title="Associations"
            icon={<Link2 className="w-4 h-4 text-purple-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            badge={associations.length > 0 ? `${associations.length}` : undefined}
        >
            <p className="text-xs text-gray-500 mb-3">
                Define relationships between achievements (e.g., a course is a child of a program)
            </p>

            {hasErrors && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-600">
                        Some associations have invalid references
                    </p>
                </div>
            )}

            {achievements.length < 2 && (
                <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-500">
                        Add at least two achievements to create associations between them.
                    </p>
                </div>
            )}

            {associations.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-3">No associations added</p>
            ) : (
                <div className="space-y-3">
                    {associations.map((assoc, index) => {
                        const sourceAch = achievements.find(a => a.id === assoc.sourceAchievementId);
                        const targetAch = achievements.find(a => a.id === assoc.targetAchievementId);
                        const sourceError = getFieldError(validationErrors, `associations.${index}.source`);
                        const targetError = getFieldError(validationErrors, `associations.${index}.target`);

                        return (
                            <div
                                key={assoc.id}
                                className="p-3 border border-gray-200 rounded-lg space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-purple-700">
                                        Association {index + 1}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeAssociation(index)}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Source Achievement */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Source Achievement
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={assoc.sourceAchievementId}
                                            onChange={e =>
                                                updateAssociation(index, {
                                                    sourceAchievementId: e.target.value,
                                                })
                                            }
                                            className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white ${
                                                sourceError ? 'border-red-300' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Select achievement...</option>
                                            {achievements.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.achievement.name.value || 'Untitled Achievement'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    {sourceError && (
                                        <p className="text-xs text-red-500 mt-1">{sourceError}</p>
                                    )}
                                </div>

                                {/* Association Type */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Relationship Type
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={assoc.associationType.value}
                                            onChange={e =>
                                                updateAssociation(index, {
                                                    associationType: staticField(e.target.value),
                                                })
                                            }
                                            className="w-full px-3 py-2 pr-8 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                                        >
                                            {CLR2_ASSOCIATION_TYPES.map(type => (
                                                <option key={type} value={type}>
                                                    {type.replace(/([A-Z])/g, ' $1').trim()}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Target Achievement */}
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        Target Achievement
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={assoc.targetAchievementId}
                                            onChange={e =>
                                                updateAssociation(index, {
                                                    targetAchievementId: e.target.value,
                                                })
                                            }
                                            className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white ${
                                                targetError ? 'border-red-300' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Select achievement...</option>
                                            {achievements.map(a => (
                                                <option key={a.id} value={a.id}>
                                                    {a.achievement.name.value || 'Untitled Achievement'}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    {targetError && (
                                        <p className="text-xs text-red-500 mt-1">{targetError}</p>
                                    )}
                                </div>

                                {/* Relationship summary */}
                                {sourceAch && targetAch && (
                                    <div className="p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
                                        <span className="font-medium">
                                            {sourceAch.achievement.name.value || 'Source'}
                                        </span>
                                        {' '}
                                        <span className="text-purple-500">
                                            {assoc.associationType.value.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
                                        </span>
                                        {' '}
                                        <span className="font-medium">
                                            {targetAch.achievement.name.value || 'Target'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <button
                type="button"
                onClick={addAssociation}
                disabled={achievements.length < 2}
                className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-3 h-3" />
                Add Association
            </button>
        </CollapsibleSection>
    );
};

export default AssociationsSection;
