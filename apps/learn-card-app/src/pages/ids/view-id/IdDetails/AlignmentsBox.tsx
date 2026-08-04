import React, { useState } from 'react';

import AlignmentRow from './AlignmentRow';
import InfoIcon from 'learn-card-base/svgs/InfoIcon';
import InfoBox from './InfoBox';
import SkillCompetencyAlignmentCard from './SkillCompetencyAlignmentCard';
import { isSkillCompetencyAlignment } from 'learn-card-base';

type Alignment = {
    targetUrl: string;
    targetName: string;
    targetFramework: string;
    targetCode?: string;
    targetDescription?: string;
    targetType?: string;
};

type AlignmentsBoxProps = {
    alignment: Alignment | Alignment[];
    style: 'Certificate' | 'boost';
};

const isCredentialEngine = (a: Alignment): boolean =>
    a.targetType === 'ceterms:Credential' || a.targetFramework === 'Credential Engine Registry';

const isOpenSyllabus = (a: Alignment): boolean =>
    a.targetFramework === 'Open Syllabus' ||
    a.targetFramework === 'Open Syllabus Field Classification';

const isSkillOrCompetency = (a: Alignment): boolean =>
    isSkillCompetencyAlignment({ targetType: a.targetType, targetUrl: a.targetUrl });

const AlignmentsBox: React.FC<AlignmentsBoxProps> = ({ alignment, style }) => {
    const [showInfo, setShowInfo] = useState(false);
    const alignmentText = `
    Alignments in your Open Badge credential link your achievement to established frameworks, standards, or competencies. 
    Each alignment shows how your boost directly relates to skills, knowledge areas, and professional standards that are recognized in your field.
    `;

    const list = (Array.isArray(alignment) ? alignment : [alignment]).filter(
        a => !isOpenSyllabus(a)
    );
    if (list.length === 0) return null;

    const skillCompetencies = list.filter(isSkillOrCompetency);
    const verified = list.filter(a => !isSkillOrCompetency(a) && isCredentialEngine(a));
    const other = list.filter(a => !isSkillOrCompetency(a) && !isCredentialEngine(a));

    const renderRow = (object: Alignment, index: number, isVerified: boolean) => (
        <AlignmentRow
            key={`${object.targetUrl ?? object.targetName}-${index}`}
            url={object.targetUrl}
            name={object.targetName}
            framework={object.targetFramework}
            code={object.targetCode}
            description={object.targetDescription}
            verified={isVerified}
        />
    );

    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom p-[15px] w-full">
            <div className="flex w-full items-center">
                <h3
                    className={
                        style === 'Certificate'
                            ? 'text-[17px] text-grayscale-900 font-poppins'
                            : 'text-[22px] font-mouse'
                    }
                >
                    Alignments
                </h3>
                <button
                    className="ml-auto"
                    aria-label={
                        showInfo ? 'Hide alignment information' : 'Show alignment information'
                    }
                    onClick={e => {
                        e.stopPropagation();
                        setShowInfo(!showInfo);
                    }}
                >
                    <InfoIcon className={showInfo ? 'text-emerald-500' : 'text-grayscale-900'} />
                </button>
            </div>
            {showInfo && <InfoBox text={alignmentText} handleClose={() => setShowInfo(false)} />}

            {skillCompetencies.length > 0 && (
                <div className="flex w-full flex-col gap-[8px]">
                    <span className="font-poppins text-[11px] font-medium text-grayscale-500">
                        Skills &amp; competencies
                    </span>
                    {skillCompetencies.map((object, index) => (
                        <SkillCompetencyAlignmentCard
                            key={`${object.targetUrl ?? object.targetName}-${index}`}
                            alignment={object}
                        />
                    ))}
                </div>
            )}

            {verified.length > 0 && (
                <div className="flex flex-col gap-[8px] w-full">
                    <span className="text-[11px] font-medium text-grayscale-500 font-poppins">
                        Verified source
                    </span>
                    {verified.map((object, index) => renderRow(object, index, true))}
                </div>
            )}

            {other.length > 0 && (
                <div className="flex flex-col gap-[8px] w-full">
                    <span className="text-[11px] font-medium text-grayscale-500 font-poppins">
                        Occupations &amp; programs
                    </span>
                    {other.map((object, index) => renderRow(object, index, false))}
                </div>
            )}
        </div>
    );
};

export default AlignmentsBox;
