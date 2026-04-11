/**
 * AchievementSection - Thin wrapper around AchievementEditor for OBv3 single-achievement mode.
 * Manages the CollapsibleSection and routes template changes through credentialSubject.achievement.
 */

import React from 'react';
import { Trophy } from 'lucide-react';

import {
    OBv3CredentialTemplate,
    AchievementTemplate,
} from '../types';
import { CollapsibleSection } from '../FieldEditor';
import { FieldValidationError } from '../utils';
import { AchievementEditor } from './AchievementEditor';

interface AchievementSectionProps {
    template: OBv3CredentialTemplate;
    onChange: (template: OBv3CredentialTemplate) => void;
    isExpanded: boolean;
    onToggle: () => void;
    disableDynamicFields?: boolean;
    validationErrors?: FieldValidationError[];
}

export const AchievementSection: React.FC<AchievementSectionProps> = ({
    template,
    onChange,
    isExpanded,
    onToggle,
    disableDynamicFields = false,
    validationErrors = [],
}) => {
    const achievement = template.credentialSubject.achievement;

    const handleAchievementChange = (updated: AchievementTemplate) => {
        onChange({
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                achievement: updated,
            },
        });
    };

    return (
        <CollapsibleSection
            title="Achievement"
            icon={<Trophy className="w-4 h-4 text-amber-600" />}
            isExpanded={isExpanded}
            onToggle={onToggle}
            badge={achievement.achievementType?.value}
        >
            <AchievementEditor
                achievement={achievement}
                onChange={handleAchievementChange}
                disableDynamicFields={disableDynamicFields}
                validationErrors={validationErrors}
                validationPrefix="achievement"
            />
        </CollapsibleSection>
    );
};

export default AchievementSection;
