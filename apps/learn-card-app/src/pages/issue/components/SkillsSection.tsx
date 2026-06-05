import React, { useCallback, useMemo, useRef } from 'react';

import { useGlobalSkillFrameworks } from '../../../helpers/globalSkillFrameworks.helpers';
import SkillSearchSelector from '../../skills/SkillSearchSelector';
import type { SelectedSkill } from '../../skills/skillTypes';
import { SkillLevel } from '../../skills/skillTypes';
import type { SkillFrameworkNode } from '../../../components/boost/boost';
import type { ResolvedSkill } from './skillAlignment';

interface SkillsSectionProps {
    selectedSkills: SelectedSkill[];
    onSelectedSkillsChange: (skills: SelectedSkill[]) => void;
    onResolvedSkillsChange: (resolved: ResolvedSkill[]) => void;
}

const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

const keyFor = (frameworkId: string, id: string) => `${frameworkId}::${id}`;

export const SkillsSection: React.FC<SkillsSectionProps> = ({
    selectedSkills,
    onSelectedSkillsChange,
    onResolvedSkillsChange,
}) => {
    const frameworks = useGlobalSkillFrameworks();
    const resolvedRef = useRef<Map<string, ResolvedSkill>>(new Map());

    const frameworkNameById = useMemo(() => {
        const map = new Map<string, string>();
        frameworks.forEach(f => map.set(f.frameworkId, f.name));
        return map;
    }, [frameworks]);

    const emitResolved = useCallback(
        (skills: SelectedSkill[]) => {
            const resolved = skills
                .map(s => resolvedRef.current.get(keyFor(s.frameworkId, s.id)))
                .filter((r): r is ResolvedSkill => Boolean(r));
            onResolvedSkillsChange(resolved);
        },
        [onResolvedSkillsChange]
    );

    const handleSelectedSkillsChange = useCallback(
        (skills: SelectedSkill[]) => {
            onSelectedSkillsChange(skills);
            emitResolved(skills);
        },
        [onSelectedSkillsChange, emitResolved]
    );

    const handleAddSkill = useCallback(
        (skill: SkillFrameworkNode, proficiency: SkillLevel) => {
            const frameworkId = skill.frameworkId ?? skill.targetFramework ?? '';
            if (!frameworkId || !skill.id) return;

            resolvedRef.current.set(keyFor(frameworkId, skill.id), {
                id: skill.id,
                frameworkId,
                targetName: skill.targetName,
                targetDescription: skill.targetDescription,
                targetCode: skill.targetCode,
                frameworkName: frameworkNameById.get(frameworkId),
            });

            const next: SelectedSkill[] = [
                ...selectedSkills,
                { id: skill.id, frameworkId, proficiency: proficiency ?? SkillLevel.Hidden },
            ];
            handleSelectedSkillsChange(next);
        },
        [selectedSkills, frameworkNameById, handleSelectedSkillsChange]
    );

    const handleRemoveSkill = useCallback(
        (frameworkId: string, skillId: string) => {
            const next = selectedSkills.filter(
                s => !(s.id === skillId && s.frameworkId === frameworkId)
            );
            handleSelectedSkillsChange(next);
        },
        [selectedSkills, handleSelectedSkillsChange]
    );

    return (
        <section className={`${CARD_CLASS} space-y-3`}>
            <div>
                <h3 className="text-base font-semibold text-grayscale-900">Skills</h3>
                <p className="text-sm text-grayscale-600 leading-relaxed mt-1">
                    Search competencies to align this credential to a framework.
                </p>
            </div>
            <SkillSearchSelector
                selectedSkills={selectedSkills}
                onSelectedSkillsChange={handleSelectedSkillsChange}
                onAddSkill={handleAddSkill}
                onRemoveSkill={handleRemoveSkill}
                showSuggestSkill
            />
        </section>
    );
};
