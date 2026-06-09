import React from 'react';

import X from '../svgs/X';
import { FlatIcon } from 'learn-card-base/components/FlatIcon';
import ClrCompetencyBlock from './ClrCompetencyBlock';
import { CertificateDisplayIcon } from 'learn-card-base';
import { SkillsIcon } from 'learn-card-base/svgs/wallet/SkillsIcon';
import { StudiesIcon } from 'learn-card-base/svgs/wallet/StudiesIcon';

import { useModal } from 'learn-card-base';
import { formatClrDate, getLinkedCompetencies } from '../../helpers/clrRenderer.helpers';
import type {
    AssociationDisplayModel,
    CompetencyDisplayModel,
    CourseDisplayModel,
    ProgramDisplayModel,
} from '../../helpers/clrRenderer.helpers';

type CompetencySection = {
    id: string;
    dateLabel?: string;
    humanCode?: string;
    title?: string;
    competencies: CompetencyDisplayModel[];
};

const ClrCompetencyDetailPanel: React.FC<{
    competencies: CompetencyDisplayModel[];
    courses: CourseDisplayModel[];
    programs: ProgramDisplayModel[];
    associations: AssociationDisplayModel[];
    adminMode?: boolean;
}> = ({ competencies, courses, programs, associations, adminMode = false }) => {
    const { closeModal } = useModal();

    const linkedCourseSections: CompetencySection[] = courses
        .map(course => {
            const courseCompetencies = getLinkedCompetencies(
                course.sourceCredentialId,
                competencies,
                associations
            );

            if (courseCompetencies.length === 0) return undefined;

            return {
                id: `course-${course.sourceCredentialId}`,
                dateLabel: course.earnedAt?.value
                    ? `Earned ${formatClrDate(course.earnedAt.value)}`
                    : undefined,
                humanCode: course.humanCode?.value,
                title: course.name?.value ?? 'Course',
                competencies: courseCompetencies,
            };
        })
        .filter((section): section is CompetencySection => section !== undefined);

    const linkedProgramSections: CompetencySection[] = programs
        .map(program => {
            const programCompetencies = getLinkedCompetencies(
                program.sourceCredentialId,
                competencies,
                associations
            );

            if (programCompetencies.length === 0) return undefined;

            return {
                id: `program-${program.sourceCredentialId}`,
                dateLabel: program.earnedAt?.value
                    ? `Awarded ${formatClrDate(program.earnedAt.value)}`
                    : undefined,
                title: program.name?.value ?? 'Program',
                competencies: programCompetencies,
            };
        })
        .filter((section): section is CompetencySection => section !== undefined);

    const linkedCompetencyIds = new Set<string>();
    [...linkedCourseSections, ...linkedProgramSections].forEach(section => {
        section.competencies.forEach(competency =>
            linkedCompetencyIds.add(competency.sourceCredentialId)
        );
    });

    const unlinkedCompetencies = competencies.filter(
        competency => !linkedCompetencyIds.has(competency.sourceCredentialId)
    );

    const renderSection = (
        section: CompetencySection,
        icon: React.ReactNode,
        emptyHeader = false
    ) => (
        <div
            key={section.id}
            className="bg-white border border-grayscale-200 rounded-[20px] shadow-box-bottom overflow-hidden w-full"
        >
            {!emptyHeader && section.title && (
                <div className="px-3 py-3 flex items-center gap-2 min-w-0">
                    {section.dateLabel && (
                        <p className="shrink-0 text-[13px] text-grayscale-700">
                            {section.dateLabel}
                        </p>
                    )}
                    {section.dateLabel && <span className="shrink-0 text-grayscale-700">•</span>}
                    <span className="shrink-0 text-grayscale-700">
                        <FlatIcon>{icon}</FlatIcon>
                    </span>
                    {section.humanCode && (
                        <p className="shrink-0 text-[13px] font-semibold text-grayscale-700">
                            {section.humanCode}
                        </p>
                    )}
                    <p className="min-w-0 truncate text-[13px] text-grayscale-700">
                        {section.title}
                    </p>
                </div>
            )}

            <div className="border-b border-grayscale-100 border-solid w-[95%] mx-auto" />

            <div className="p-5 space-y-4">
                {section.competencies.map(competency => (
                    <ClrCompetencyBlock
                        key={competency.sourceCredentialId}
                        competency={competency}
                        adminMode={adminMode}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-10 h-full bg-grayscale-100 overflow-y-auto">
            <div className="bg-white rounded-b-[15px] overflow-hidden shadow-md px-6 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <FlatIcon>
                            <SkillsIcon className="w-6 h-6 text-grayscale-600" />
                        </FlatIcon>
                        <p className="text-[22px] text-grayscale-900 leading-tight font-semibold">
                            {competencies.length}{' '}
                            {competencies.length === 1 ? 'Competency' : 'Competencies'}
                        </p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="shrink-0 w-[50px] h-[50px] flex items-center justify-center rounded-full text-grayscale-600 bg-white border-solid border-grayscale-100 border-[2px]"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-4">
                {linkedCourseSections.map(section =>
                    renderSection(section, <StudiesIcon className="w-4 h-4" />)
                )}

                {linkedProgramSections.map(section =>
                    renderSection(
                        section,
                        <CertificateDisplayIcon className="w-4 h-4 !text-grayscale-500" />
                    )
                )}

                {unlinkedCompetencies.length > 0 &&
                    renderSection(
                        {
                            id: 'other-competencies',
                            title: undefined,
                            competencies: unlinkedCompetencies,
                        },
                        <SkillsIcon className="w-4 h-4" />,
                        true
                    )}

                {competencies.length === 0 && (
                    <div className="bg-white border border-grayscale-200 rounded-[20px] p-6">
                        <p className="text-sm text-grayscale-600">
                            No competencies were included in this record.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClrCompetencyDetailPanel;
